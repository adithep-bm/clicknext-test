"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import Modal from "../components/Modal";
import TransactionHistoryView from "../components/TransactionHistory";


const api = axios.create({ baseURL: "http://localhost:3001/api" });
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

const DepositWithdrawView = ({
  balance,
  error,
  amount,
  setAmount,
  onActionClick,
}: any) => (
  <div className="flex flex-col w-full h-full p-4 md:p-6 flex items-center space-y-4">
    <h2 className="text-xl font-semibold mb-6 text-left ">
      จำนวนเงินคงเหลือ{" "}
      {balance.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}{" "}
      บาท
    </h2>
    <div className="w-full max-w-xs mx-auto flex flex-col items-start">
      <label htmlFor="amount" className="text-md font-semibold mb-2">
        จำนวนเงิน *
      </label>
      <input
        id="amount"
        type="number"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder="กรอกจำนวนเงิน"
        className="w-full px-3 py-2 border rounded-md text-center focus:outline-none focus:ring-2 focus:ring-gray-800"
      />
      {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
      <div className="flex space-x-4 mt-4 w-full">
        <button
          onClick={() => onActionClick("deposit")}
          className="bg-green-500 cursor-pointer text-white w-full py-2 rounded-md hover:bg-green-600"
        >
          ฝาก
        </button>
        <button
          onClick={() => onActionClick("withdraw")}
          className="bg-red-500 cursor-pointer text-white w-full py-2 rounded-md hover:bg-red-600"
        >
          ถอน
        </button>
      </div>
    </div>
  </div>
);

export default function DashboardPage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false); 
  const [user, setUser] = useState({ email: "" });
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [amount, setAmount] = useState("");
  const [editAmount, setEditAmount] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();
  const [activeView, setActiveView] = useState("deposit_withdraw");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState({
    title: "",
    children: null as React.ReactNode,
    onConfirm: () => {},
  });
  const [transactionToEdit, setTransactionToEdit] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 5;

  const fetchData = async () => {
    try {
      const response = await api.get("/user/data");
      setUser(response.data.user);
      setBalance(response.data.balance);
      setTransactions(response.data.transactions);
    } catch (err: any) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        handleLogout();
      } else {
        setError("Could not connect to the server.");
      }
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleEditClick = (transaction: any) => {
    setTransactionToEdit(transaction);
    setEditAmount(transaction.amount.toString());
    setIsModalOpen(true);
  };

  useEffect(() => {
    if (transactionToEdit) {
      setModalContent({
        title: "แก้ไขจำนวนเงินฝาก",
        children: (
          <div>
            <p className="mb-2">
              ของวันที่{" "}
              {new Date(transactionToEdit.timestamp).toLocaleString("th-TH", {
                hour12: false,
              })}
            </p>
            <p className="mb-4 text-sm text-gray-500">จากอีเมล {user.email}</p>
            <h2>จำนวนเงิน*</h2>
            <input
              type="number"
              value={editAmount}
              onChange={(e) => setEditAmount(e.target.value)}
              className="w-full mt-2 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={transactionToEdit.amount.toLocaleString()}
              autoFocus
            />
          </div>
        ),
        onConfirm: async () => {
          const numAmount = parseFloat(editAmount);
          if (isNaN(numAmount) || numAmount <= 0 || numAmount > 100000) {
            alert("กรุณาใส่จำนวนระหว่าง 1 - 100,000");
            return;
          }
          const amountDifference = numAmount - transactionToEdit.amount;
          const potentialNewBalance = balance + amountDifference;
          if (potentialNewBalance < 0) {
            alert("ไม่สามารถแก้ไขได้ ยอดเงินในบัญชีจะติดลบ");
            return;
          }
          await api.put(`/transactions/${transactionToEdit.id}`, {
            amount: numAmount,
          });
          fetchData();
          setIsModalOpen(false);
          setTransactionToEdit(null);
        },
      });
    }
  }, [editAmount, transactionToEdit, balance]);

  const handleActionClick = (type: "deposit" | "withdraw") => {
    setTransactionToEdit(null);
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0 || numAmount > 100000) {
      setError("กรุณาใส่จำนวนระหว่าง 1 - 100,000");
      return;
    }
    if (type === "withdraw" && numAmount > balance) {
      setError("ไม่สามารถถอนเงินได้ เนื่องจากยอดเงินคงเหลือไม่เพียงพอ");
      return;
    }
    setError("");
    setModalContent({
      title: "ยืนยันการฝาก-ถอน",
      children: <p>จำนวนเงิน {numAmount.toLocaleString()} บาท</p>,
      onConfirm: async () => {
        await api.post("/transactions", { type, amount: numAmount });
        setAmount("");
        fetchData();
        setIsModalOpen(false);
      },
    });
    setIsModalOpen(true);
  };

  const handleDeleteClick = (transaction: any) => {
    setTransactionToEdit(null);
    setModalContent({
      title: "ยืนยันการลบ",
      children: (
        <div>
          <p>จำนวนเงินถอน {transaction.amount.toLocaleString()} บาท</p>
          <p>
            ของวันที่:{" "}
            {new Date(transaction.timestamp).toLocaleString("th-TH", {
              hour12: false,
            })}
          </p>
          <p>จากอีเมล: {user.email}</p>
        </div>
      ),
      onConfirm: async () => {
        await api.delete(`/transactions/${transaction.id}`);
        fetchData();
        setIsModalOpen(false);
      },
    });
    setIsModalOpen(true);
  };

  const handleLogout = () => {
    localStorage.clear();
    router.push("/login");
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setTransactionToEdit(null);
  };

  const handleMenuSelect = (view: string) => {
    setActiveView(view);
    setIsMenuOpen(false);
  };

  const totalTransactions = transactions.length;
  const totalPages = Math.ceil(totalTransactions / ITEMS_PER_PAGE) || 1;
  const indexOfLastItem = currentPage * ITEMS_PER_PAGE;
  const indexOfFirstItem = indexOfLastItem - ITEMS_PER_PAGE;
  const currentTransactions = transactions.slice(
    indexOfFirstItem,
    indexOfLastItem
  );

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const MenuContent = () => (
    <div className="p-4 space-y-2 flex h-screen flex-col justify-between">
      <div className="">
        <h2 className="text-lg font-semibold px-4 mb-4 lg:hidden">Menu</h2>
        <button
          onClick={() => handleMenuSelect("deposit_withdraw")}
          className={`w-full text-left px-4 py-2 rounded-md font-semibold cursor-pointer mb-2 ${
            activeView === "deposit_withdraw"
              ? "bg-gray-800 text-white"
              : "hover:bg-gray-200 text-gray-700"
          }`}
        >
          Deposit / Withdraw
        </button>
        <button
          onClick={() => handleMenuSelect("transaction")}
          className={`w-full text-left px-4 py-2 rounded-md font-semibold cursor-pointer ${
            activeView === "transaction"
              ? "bg-gray-800 text-white"
              : "hover:bg-gray-200 text-gray-700"
          }`}
        >
          Transaction
        </button>
      </div>
      <div className="">
        <button
          onClick={() => setIsMenuOpen(false)}
          className="flex justify-center cursor-pointer w-full text-left px-4 py-2 rounded-md font-semibold text-red-600 hover:bg-red-100 lg:hidden"
        >
          Close
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100">
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onConfirm={modalContent.onConfirm}
        title={modalContent.title}
      >
        {modalContent.children}
      </Modal>

      {isMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-[rgba(0,0,0,0.5)] backdrop-blur-sm transition-opacity z-40"
          onClick={() => setIsMenuOpen(false)}
        ></div>
      )}
      <aside
        className={`lg:hidden fixed top-0 left-0 h-full bg-white shadow-lg z-50 w-64 transform transition-transform ${
          isMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <MenuContent />
      </aside>

      <header className="bg-white shadow-md sticky top-0 z-30">
        <div className="container mx-auto py-3 px-4 flex items-center justify-between">

          <button
            onClick={() => setIsMenuOpen(true)}
            className="lg:hidden p-2 cursor-pointer -ml-2"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>

          <h1 className="text-xl font-bold text-gray-800 text-center lg:text-left flex-1 lg:flex-none">
            Clicknext
          </h1>

          <button
            onClick={handleLogout}
            className="bg-gray-800 cursor-pointer text-white px-4 py-1.5 rounded-md hover:bg-gray-900 text-sm"
          >
            Logout
          </button>
        </div>
      </header>

      <div className="container mx-auto mt-0 lg:mt-6 flex">

        <aside className="hidden lg:block w-64 bg-white rounded-md shadow-md p-4 mr-6 flex-shrink-0 self-start">
          <MenuContent />
        </aside>

        <main className="flex-1 bg-white lg:rounded-md lg:shadow-md min-h-[calc(100vh-80px)]">
          {activeView === "deposit_withdraw" && (
            <DepositWithdrawView
              balance={balance}
              error={error}
              amount={amount}
              setAmount={setAmount}
              onActionClick={handleActionClick}
            />
          )}
          {activeView === "transaction" && (
            <TransactionHistoryView
              transactions={currentTransactions}
              onEditClick={handleEditClick}
              onDeleteClick={handleDeleteClick}
              userEmail={user.email}
              currentPage={currentPage}
              totalPages={totalPages}
              onNextPage={handleNextPage}
              onPrevPage={handlePrevPage}
              itemStart={totalTransactions > 0 ? indexOfFirstItem + 1 : 0}
              itemEnd={Math.min(indexOfLastItem, totalTransactions)}
              totalItems={totalTransactions}
            />
          )}
        </main>
      </div>
    </div>
  );
}

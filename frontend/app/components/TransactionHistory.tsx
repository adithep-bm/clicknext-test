"use client";

import React from "react";

const formatDate = (dateString: string) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  return `${date.toLocaleDateString("th-TH")}\n${date.toLocaleTimeString("th-TH", { hour: '2-digit', minute: '2-digit' })}`;
};

const TransactionHistoryView = ({
  transactions, onEditClick, onDeleteClick, userEmail, currentPage, totalPages, onNextPage, onPrevPage, itemStart, itemEnd, totalItems
}: any) => (
  <div className="p-4">
    <h2 className="text-xl font-semibold mb-4">ประวัติรายการฝากถอน</h2>
    <div className="border rounded-md shadow-sm overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-2 md:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-pre-line">Datetime</th>
            <th className="px-2 md:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
            <th className="px-2 md:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
            <th className="hidden lg:table-cell px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
            <th className="px-2 md:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {transactions.length > 0 ? (
            transactions.map((tx: any) => (
              <tr key={tx.id}>
                <td className="px-2 w-1/4 md:px-4 py-2 text-xs md:text-sm text-gray-500">{formatDate(tx.timestamp)}</td>
                <td className="px-2 md:px-4 py-2 text-xs md:text-sm">{tx.amount.toLocaleString()}</td>
                <td className={`px-2 md:px-4 py-2 text-xs md:text-sm font-semibold ${tx.type === "deposit" ? "text-green-600" : "text-red-600"}`}>
                  {tx.type === "deposit" ? "ฝาก" : "ถอน"}
                </td>
                <td className="hidden lg:table-cell px-4 py-2 text-sm text-gray-500">{userEmail}</td>
                <td className="px-2 md:px-4 py-2 text-sm">
                   <button
                      onClick={() => tx.type === 'deposit' ? onEditClick(tx) : onDeleteClick(tx)}
                      className="bg-gray-800 w-3/4 sm:w-5/7 md:3/7 text-white px-3 py-1 rounded-md hover:bg-gray-900 text-xs">
                      {tx.type === 'deposit' ? 'Edit' : 'Delete'}
                    </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td className="px-6 py-4 text-center text-sm text-gray-500" colSpan={5}>
                No transactions yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
    <div className="flex items-center justify-between mt-4">
      <span className="text-xs md:text-sm text-gray-700">
        แสดง {totalItems > 0 ? itemStart : 0} ถึง {itemEnd} จาก {totalItems} รายการ
      </span>
      {totalPages > 1 && (
        <div className="flex space-x-2">
            <button onClick={onPrevPage} disabled={currentPage === 1} className="px-3 py-1 text-xs md:text-sm font-medium text-white bg-gray-800 rounded-md hover:bg-gray-900 disabled:bg-gray-400">
            ก่อนหน้า
            </button>
            <button onClick={onNextPage} disabled={currentPage === totalPages} className="px-3 py-1 text-xs md:text-sm font-medium text-white bg-gray-800 rounded-md hover:bg-gray-900 disabled:bg-gray-400">
            ถัดไป
            </button>
        </div>
      )}
    </div>
  </div>
);

export default TransactionHistoryView;
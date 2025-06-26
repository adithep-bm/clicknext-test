'use client';

import React from 'react';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, onConfirm, title, children }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(0,0,0,0.5)] backdrop-blur-sm transition-opacity">
            <div className="relative w-full max-w-md p-6 bg-white rounded-lg shadow-xl mx-4">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">{title}</h3>
                <div className="text-gray-600 mb-6">
                    {children}
                </div>
                {/* จัดวางปุ่มตามที่คุณต้องการ */}
                <div className="flex justify-start space-x-3">
                    <button
                        onClick={onConfirm}
                        className="px-4 py-2 text-white bg-gray-800  rounded-lg hover:bg-blue-700"
                    >
                        ยืนยัน
                    </button>
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
                    >
                        ยกเลิก
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Modal;
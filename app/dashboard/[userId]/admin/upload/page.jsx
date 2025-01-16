"use client"
import React, { useState } from 'react';
import DragDropZone from '@/app/components/DragDropZone';
import Form from '@/app/components/FormAdd';
import { IoClose } from 'react-icons/io5';

export default function MultiUploadPage() {
    const [uploadForms, setUploadForms] = useState([]);
    const [loading, setLoading] = useState(false);
    const [uploadStatus, setUploadStatus] = useState({}); // Track status of each form

    const handleFilesDrop = (acceptedFiles) => {
        const newForms = acceptedFiles.map(file => ({
            id: Date.now() + Math.random(),
            file,
            formRef: React.createRef() // Ensure consistent naming
        }));
        setUploadForms(prev => [...prev, ...newForms]);
    };

    const handleUploadAll = async () => {
        setLoading(true);
        try {
            // Try to upload each form
            const results = await Promise.all(
                uploadForms.map(async form => {
                    if (form.formRef.current) {
                        try {
                            const success = await form.formRef.current.submitForm();
                            setUploadStatus(prev => ({
                                ...prev,
                                [form.id]: success ? 'success' : 'error'
                            }));
                            return { id: form.id, success };
                        } catch (error) {
                            setUploadStatus(prev => ({
                                ...prev,
                                [form.id]: 'error'
                            }));
                            return { id: form.id, success: false };
                        }
                    }
                    return { id: form.id, success: false };
                })
            );

            // Remove only successfully uploaded forms
            setUploadForms(prev => 
                prev.filter(form => 
                    !results.find(r => r.id === form.id && r.success)
                )
            );

            // Show status message
            const successCount = results.filter(r => r.success).length;
            const failCount = results.length - successCount;
            
            if (successCount > 0) {
                alert(`Successfully uploaded ${successCount} images. ${failCount > 0 ? `${failCount} failed and remain for retry.` : ''}`);
            }

        } catch (error) {
            console.error('Error during upload:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleRemoveForm = (formId) => {
        setUploadForms(prev => prev.filter(form => form.id !== formId));
    };

    return (
        <div className="container mx-auto p-4">
            <DragDropZone onFilesDrop={handleFilesDrop} />
            
            {uploadForms.length > 0 && (
                <>
                    {/* Added safe zones with pointer-events-none */}
                    <div className="relative">
                        <div className="absolute left-0 top-0 w-8 h-full bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
                        <div className="absolute right-0 top-0 w-8 h-full bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />
                        
                        <div className="flex gap-4 overflow-x-auto py-8 px-8 snap-x scrollbar-hide">
                            {uploadForms.map((form) => (
                                <div key={form.id} 
                                    className={`min-w-[500px] flex-shrink-0 snap-center shadow-lg rounded-lg bg-white relative
                                        ${uploadStatus[form.id] === 'error' ? 'border-2 border-red-500' : ''}`}
                                >
                                    <button
                                        onClick={() => handleRemoveForm(form.id)}
                                        className="absolute -top-2 -right-2 z-50 p-2 rounded-full bg-black text-white hover:bg-gray-800 transition-colors"
                                    >
                                        <IoClose size={20} />
                                    </button>
                                    <Form 
                                        ref={form.formRef}
                                        initialFile={form.file}
                                        isBulkUpload={true}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>

                    <button
                        onClick={handleUploadAll}
                        disabled={loading}
                        className="fixed bottom-8 right-8 bg-black text-white px-8 py-4 rounded-full shadow-lg
                            hover:bg-gray-800 disabled:bg-gray-400 transition-colors z-50"
                    >
                        {loading ? 'Uploading...' : `Upload All (${uploadForms.length})`}
                    </button>
                </>
            )}
        </div>
    );
}
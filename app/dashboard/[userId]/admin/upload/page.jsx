"use client"
import React, { useState } from 'react';
import DragDropZone from '@/app/components/DragDropZone';
import Form from '@/app/components/FormAdd';

export default function MultiUploadPage() {
    const [uploadForms, setUploadForms] = useState([]);
    const [loading, setLoading] = useState(false);

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
            const results = await Promise.all(
                uploadForms.map(async form => {
                    if (form.formRef.current) {
                        const success = await form.formRef.current.submitForm();
                        return { id: form.id, success };
                    }
                    return { id: form.id, success: false };
                })
            );

            // Remove successfully uploaded forms
            setUploadForms(prev => 
                prev.filter(form => 
                    !results.find(r => r.id === form.id && r.success)
                )
            );
        } catch (error) {
            console.error('Error uploading files:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mx-auto p-4">
            <DragDropZone onFilesDrop={handleFilesDrop} />
            
            {uploadForms.length > 0 && (
                <>
                    <div className="flex gap-4 overflow-x-auto py-8 snap-x scrollbar-hide">
                        {uploadForms.map((form) => (
                            <div key={form.id} 
                                className="min-w-[500px] flex-shrink-0 snap-center shadow-lg rounded-lg"
                            >
                                <Form 
                                    ref={form.formRef}
                                    initialFile={form.file}
                                />
                            </div>
                        ))}
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
import React, { useState } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, Shield, ArrowLeft } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { useToast } from '../../components/ui/Alert';
import { uploadResultadoLab } from '../../api/laboratorio';

export default function UploadResultadoPage() {
    const [searchParams] = useSearchParams();
    const idSolicitud = searchParams.get('id_solicitud');
    const navigate = useNavigate();
    const toast = useToast();

    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [result, setResult] = useState(null);

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile && selectedFile.type === 'application/pdf') {
            setFile(selectedFile);
        } else {
            toast('Por favor selecciona un archivo PDF válido.', 'error');
            setFile(null);
        }
    };

    const handleUpload = async () => {
        if (!file || !idSolicitud) return;

        setUploading(true);
        try {
            const data = await uploadResultadoLab(idSolicitud, file);
            setResult(data);
            toast('Resultado de laboratorio subido con éxito.', 'success');
        } catch (err) {
            console.error(err);
            toast('Error al subir el archivo. Inténtalo de nuevo.', 'error');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-6 space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <button 
                        onClick={() => navigate(-1)}
                        className="flex items-center text-sm text-text-secondary hover:text-primary transition-colors mb-2"
                    >
                        <ArrowLeft size={16} className="mr-1" /> Volver
                    </button>
                    <h1 className="text-3xl font-bold tracking-tight text-text-primary">Subir Resultado de Laboratorio</h1>
                    <p className="text-text-secondary mt-1">Carga de documentos externos con trazabilidad NOM-151.</p>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-primary/5 border border-primary/20 rounded-full">
                    <Shield size={18} className="text-primary" />
                    <span className="text-xs font-bold text-primary uppercase tracking-widest">Carga Segura</span>
                </div>
            </div>

            {!result ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Instrucciones */}
                    <div className="md:col-span-1 space-y-4">
                        <div className="p-4 bg-white rounded-xl border border-border shadow-sm">
                            <h3 className="font-bold text-sm mb-2">Instrucciones de Carga</h3>
                            <ul className="text-xs text-text-secondary space-y-3">
                                <li className="flex gap-2">
                                    <span className="font-bold text-primary">1.</span>
                                    <span>El archivo debe estar en formato **PDF**.</span>
                                </li>
                                <li className="flex gap-2">
                                    <span className="font-bold text-primary">2.</span>
                                    <span>Se calculará un hash **SHA-256** para asegurar que el documento sea inmutable.</span>
                                </li>
                                <li className="flex gap-2">
                                    <span className="font-bold text-primary">3.</span>
                                    <span>El archivo se almacenará de forma privada en la nube de **Azure**.</span>
                                </li>
                            </ul>
                        </div>
                    </div>

                    {/* Area de Drop */}
                    <div className="md:col-span-2">
                        <div className={`
                            relative border-2 border-dashed rounded-2xl p-12 transition-all flex flex-col items-center justify-center
                            ${file ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50 hover:bg-slate-50'}
                        `}>
                            <input 
                                type="file" 
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                onChange={handleFileChange}
                                accept=".pdf"
                            />
                            
                            <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${file ? 'bg-primary text-white' : 'bg-slate-100 text-slate-400'}`}>
                                <Upload size={32} />
                            </div>
                            
                            {file ? (
                                <div className="text-center">
                                    <p className="font-bold text-text-primary mb-1">{file.name}</p>
                                    <p className="text-xs text-text-secondary">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                </div>
                            ) : (
                                <div className="text-center">
                                    <p className="font-bold text-text-primary mb-1">Haz clic o arrastra un PDF aquí</p>
                                    <p className="text-xs text-text-secondary font-mono uppercase tracking-tighter">PDF máximo 10MB</p>
                                </div>
                            )}
                        </div>

                        <div className="mt-6 flex justify-end">
                            <Button 
                                size="lg" 
                                disabled={!file || uploading} 
                                isLoading={uploading}
                                onClick={handleUpload}
                                className="px-12"
                            >
                                Iniciar Carga Segura
                            </Button>
                        </div>
                    </div>
                </div>
            ) : (
                /* Pantalla de Éxito */
                <div className="bg-white border border-border rounded-2xl p-12 flex flex-col items-center text-center animate-in zoom-in-95 duration-500 shadow-xl">
                    <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6">
                        <CheckCircle size={48} />
                    </div>
                    <h2 className="text-2xl font-bold text-text-primary mb-2">Archivo Subido Exitosamente</h2>
                    <p className="text-text-secondary max-w-md mb-8">
                        El resultado de laboratorio ha sido procesado y almacenado bajo cumplimiento forense.
                    </p>

                    <div className="w-full max-w-lg bg-slate-50 rounded-xl p-6 border border-slate-200 text-left space-y-4">
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Hash de Integridad (SHA-256)</p>
                            <code className="block p-3 bg-white border border-slate-200 rounded-lg text-xs font-mono text-primary break-all">
                                {result.pdf_hash}
                            </code>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">ID de Resultado</p>
                                <p className="text-sm font-mono text-text-primary truncate">{result.id_resultado}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Timestamp</p>
                                <p className="text-sm text-text-primary">{new Date(result.fecha_subida).toLocaleString()}</p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-10 flex gap-4">
                        <Button variant="outline" onClick={() => setResult(null)}>
                            Subir otro archivo
                        </Button>
                        <Button onClick={() => navigate('/dashboard')}>
                            Volver al Panel
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}

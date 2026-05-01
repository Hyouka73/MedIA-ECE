import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { documentosAPI } from '../../api/documentos';
import { getResultadosBySolicitud } from '../../api/laboratorio';
import {
  ChevronLeft, FileText, Pill, FlaskConical, Send,
  Download, AlertCircle, Filter, Clock, CheckCircle, XCircle, Upload
} from 'lucide-react';

/**
 * DocumentosPage — Centro de Documentos (Módulo 12)
 */
export default function DocumentosPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const idPaciente = searchParams.get('id_paciente');

  const [documentos, setDocumentos] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filtroTipo, setFiltroTipo] = useState('TODOS');
  const [descargando, setDescargando] = useState(null);
  const [resultadosSolicitud, setResultadosSolicitud] = useState({ id: null, items: [], loading: false });

  useEffect(() => {
    if (!idPaciente) {
      setLoading(false);
      return;
    }
    loadDocumentos();
  }, [idPaciente]);

  const loadDocumentos = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await documentosAPI.getDocumentos(idPaciente);
      setDocumentos(data.data);
    } catch (err) {
      console.error('Error cargando documentos:', err);
      setError('No se pudieron cargar los documentos del paciente');
    } finally {
      setLoading(false);
    }
  };

  const handleDescargarPDF = async (doc) => {
    if (!doc.pdf_disponible) {
      alert('La generación de PDF estará disponible próximamente.');
      return;
    }
    try {
      setDescargando(doc.id);
      await documentosAPI.descargarPDF(doc.pdf_endpoint);
    } catch (err) {
      console.error('Error descargando PDF:', err);
      alert('Error al descargar el documento');
    } finally {
      setDescargando(null);
    }
  };

  const handleVerResultados = async (solicitudId) => {
    if (resultadosSolicitud.id === solicitudId) {
      setResultadosSolicitud({ id: null, items: [], loading: false });
      return;
    }
    
    try {
      setResultadosSolicitud({ id: solicitudId, items: [], loading: true });
      const data = await getResultadosBySolicitud(solicitudId);
      setResultadosSolicitud({ id: solicitudId, items: data, loading: false });
    } catch (err) {
      console.error('Error cargando resultados:', err);
      setResultadosSolicitud({ id: null, items: [], loading: false });
      alert('Error al cargar los resultados de laboratorio');
    }
  };

  const tipoConfig = {
    NOTA_SOAP: { icon: FileText, label: 'Nota SOAP', color: '#2459A8', bg: '#E3F2FD', emoji: '📋' },
    RECETA: { icon: Pill, label: 'Receta Médica', color: '#237A4B', bg: '#E8F5E9', emoji: '💊' },
    SOLICITUD_ESTUDIO: { icon: FlaskConical, label: 'Solicitud de Estudio', color: '#8B5CF6', bg: '#F3E8FF', emoji: '🔬' },
    REFERENCIA: { icon: Send, label: 'Referencia Médica', color: '#E8921F', bg: '#FFF3E0', emoji: '📤' },
  };

  const getAllDocuments = () => {
    if (!documentos) return [];
    let all = [
      ...(documentos.notas || []),
      ...(documentos.recetas || []),
      ...(documentos.solicitudes || []),
      ...(documentos.referencias || []),
    ];
    if (filtroTipo !== 'TODOS') all = all.filter(d => d.tipo_documento === filtroTipo);
    all.sort((a, b) => (b.fecha ? new Date(b.fecha) : 0) - (a.fecha ? new Date(a.fecha) : 0));
    return all;
  };

  if (!idPaciente) {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: 40, background: '#EDEBE6' }}>
        <FileText size={64} style={{ color: '#DAD4CC', marginBottom: 16 }} />
        <h2 style={{ color: '#1A1510', fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Centro de Documentos</h2>
        <p style={{ color: '#5A5048', fontSize: 13, textAlign: 'center', maxWidth: 400, lineHeight: '1.6' }}>
          Seleccione un paciente desde el módulo de Pacientes para ver sus documentos clínicos disponibles.
        </p>
        <button onClick={() => navigate('/pacientes')}
          style={{ marginTop: 20, padding: '10px 24px', background: '#2459A8', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13, fontWeight: 500 }}>
          Ir a Pacientes
        </button>
      </div>
    );
  }

  const allDocs = getAllDocuments();

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#EDEBE6' }}>
      <div style={{ padding: '16px 28px', background: '#FDFAF5', borderBottom: '1px solid #DAD4CC' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button onClick={() => navigate(-1)} style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}>
              <ChevronLeft size={20} />
            </button>
            <div>
              <h1 style={{ color: '#1A1510', fontSize: 18, fontWeight: 700, margin: 0 }}>Documentos del Paciente</h1>
              <p style={{ color: '#5A5048', fontSize: 12, margin: '4px 0 0 0' }}>Módulo 12 — Generación de Documentos PDF (NOM-004 / NOM-151)</p>
            </div>
          </div>
        </div>
      </div>

      <div style={{ padding: '12px 28px', background: '#FDFAF5', borderBottom: '1px solid #DAD4CC', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {['TODOS', 'NOTA_SOAP', 'RECETA', 'SOLICITUD_ESTUDIO', 'REFERENCIA'].map(k => (
          <button key={k} onClick={() => setFiltroTipo(k)}
            style={{
              padding: '6px 14px', borderRadius: 20, fontSize: 12, cursor: 'pointer',
              border: `1.5px solid ${filtroTipo === k ? '#2459A8' : '#DAD4CC'}`,
              background: filtroTipo === k ? '#E3F2FD' : '#fff',
              color: filtroTipo === k ? '#2459A8' : '#5A5048',
              fontWeight: filtroTipo === k ? 600 : 400,
            }}>
            {k === 'TODOS' ? '📁 Todos' : k === 'NOTA_SOAP' ? '📋 Notas' : k === 'RECETA' ? '💊 Recetas' : k === 'SOLICITUD_ESTUDIO' ? '🔬 Solicitudes' : '📤 Referencias'}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '28px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: '#5A5048' }}>⏳ Cargando documentos...</div>
        ) : allDocs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, color: '#5A5048' }}>No se encontraron documentos.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {allDocs.map(doc => {
              const config = tipoConfig[doc.tipo_documento] || tipoConfig.NOTA_SOAP;
              const IconComponent = config.icon;

              return (
                <div key={`${doc.tipo_documento}-${doc.id}`} style={{
                  padding: '14px 18px', background: '#FDFAF5', border: '1px solid #DAD4CC', borderRadius: 10,
                  display: 'flex', flexDirection: 'column', gap: 4
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ width: 42, height: 42, borderRadius: 8, background: config.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <IconComponent size={20} style={{ color: config.color }} />
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 8px', borderRadius: 4, background: config.bg, color: config.color }}>{config.label}</span>
                        {doc.tipo_documento === 'SOLICITUD_ESTUDIO' && (
                          <span style={{ fontSize: 10, fontWeight: 600, color: doc.tiene_resultados ? '#237A4B' : '#E8921F' }}>
                            {doc.tiene_resultados ? '✓ Con resultados' : '⏳ Pendiente'}
                          </span>
                        )}
                      </div>
                      <p style={{ fontSize: 13, color: '#1A1510', margin: 0, fontWeight: 500 }}>{doc.descripcion}</p>
                      <p style={{ fontSize: 11, color: '#8A7F75', margin: 0 }}>📅 {doc.fecha ? new Date(doc.fecha).toLocaleDateString() : '—'} • 👨‍⚕️ {doc.medico}</p>
                    </div>

                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => handleDescargarPDF(doc)} disabled={!doc.pdf_disponible}
                        style={{ padding: '8px 14px', border: '1.5px solid #DAD4CC', borderRadius: 6, fontSize: 11, cursor: 'pointer', opacity: doc.pdf_disponible ? 1 : 0.5 }}>
                        PDF
                      </button>
                      {doc.tipo_documento === 'SOLICITUD_ESTUDIO' && (
                        <button onClick={() => navigate(`/laboratorio/upload?id_solicitud=${doc.id}`)}
                          style={{ padding: '8px 14px', border: '1.5px solid #8B5CF6', background: '#F3E8FF', color: '#8B5CF6', borderRadius: 6, fontSize: 11, cursor: 'pointer', fontWeight: 600 }}>
                          Subir
                        </button>
                      )}
                      {doc.tipo_documento === 'SOLICITUD_ESTUDIO' && doc.tiene_resultados && (
                        <button onClick={() => handleVerResultados(doc.id)}
                          style={{ padding: '8px 14px', border: '1.5px solid #237A4B', background: resultadosSolicitud.id === doc.id ? '#E8F5E9' : '#fff', color: '#237A4B', borderRadius: 6, fontSize: 11, cursor: 'pointer', fontWeight: 600 }}>
                          {resultadosSolicitud.id === doc.id ? 'Ocultar' : 'Resultados'}
                        </button>
                      )}
                    </div>
                  </div>

                  {resultadosSolicitud.id === doc.id && (
                    <div style={{ marginTop: 10, padding: '12px', background: '#F0F7F0', border: '1px dashed #237A4B', borderRadius: 8 }}>
                      <p style={{ fontSize: 10, fontWeight: 700, color: '#237A4B', marginBottom: 8 }}>ARCHIVOS SUBIDOS</p>
                      {resultadosSolicitud.loading ? <p style={{ fontSize: 12 }}>Cargando...</p> : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          {resultadosSolicitud.items.map(res => (
                            <div key={res.id_resultado} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fff', padding: '8px', borderRadius: 6, border: '1px solid #DAD4CC' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <FileText size={14} style={{ color: '#237A4B' }} />
                                <div>
                                  <p style={{ fontSize: 11, fontWeight: 600, margin: 0 }}>Resultado PDF</p>
                                  <p style={{ fontSize: 8, color: '#8A7F75', margin: 0 }}>Hash: {res.pdf_hash.substring(0, 20)}...</p>
                                </div>
                              </div>
                              <button onClick={() => window.open(`${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:8000'}${res.pdf_url}`, '_blank')}
                                style={{ padding: '4px 10px', background: '#237A4B', color: '#fff', border: 'none', borderRadius: 4, fontSize: 10, cursor: 'pointer' }}>
                                Ver
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

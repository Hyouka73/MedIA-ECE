import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { documentosAPI } from '../../api/documentos';
import {
  ChevronLeft, FileText, Pill, FlaskConical, Send,
  Download, AlertCircle, Filter, Clock, CheckCircle, XCircle
} from 'lucide-react';

/**
 * DocumentosPage — Centro de Documentos (Módulo 12)
 *
 * Según Doc3 Módulo 12: MedIA genera 4 documentos PDF a partir de datos
 * ya registrados en la BD. Los PDFs son generados on-demand por WeasyPrint.
 *
 * Documentos soportados:
 *   1. Nota SOAP firmada  → notas_medicas + notas_soap_detalle
 *   2. Receta médica      → prescripciones + cat_medicamentos
 *   3. Solicitud de laboratorio → solicitudes_estudio
 *   4. Referencia médica  → referencias_medicas
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

  // Configuración visual por tipo de documento
  const tipoConfig = {
    NOTA_SOAP: {
      icon: FileText,
      label: 'Nota SOAP',
      color: '#2459A8',
      bg: '#E3F2FD',
      emoji: '📋',
    },
    RECETA: {
      icon: Pill,
      label: 'Receta Médica',
      color: '#237A4B',
      bg: '#E8F5E9',
      emoji: '💊',
    },
    SOLICITUD_ESTUDIO: {
      icon: FlaskConical,
      label: 'Solicitud de Estudio',
      color: '#8B5CF6',
      bg: '#F3E8FF',
      emoji: '🔬',
    },
    REFERENCIA: {
      icon: Send,
      label: 'Referencia Médica',
      color: '#E8921F',
      bg: '#FFF3E0',
      emoji: '📤',
    },
  };

  // Combinar todos los documentos en una lista plana y filtrar
  const getAllDocuments = () => {
    if (!documentos) return [];

    let all = [
      ...(documentos.notas || []),
      ...(documentos.recetas || []),
      ...(documentos.solicitudes || []),
      ...(documentos.referencias || []),
    ];

    if (filtroTipo !== 'TODOS') {
      all = all.filter(d => d.tipo_documento === filtroTipo);
    }

    // Ordenar por fecha descendente
    all.sort((a, b) => {
      const dateA = a.fecha ? new Date(a.fecha) : new Date(0);
      const dateB = b.fecha ? new Date(b.fecha) : new Date(0);
      return dateB - dateA;
    });

    return all;
  };

  // Sin paciente seleccionado
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
      {/* TopBar */}
      <div style={{ padding: '16px 28px', background: '#FDFAF5', borderBottom: '1px solid #DAD4CC' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button onClick={() => navigate(-1)} style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}>
              <ChevronLeft size={20} />
            </button>
            <div>
              <h1 style={{ color: '#1A1510', fontSize: 18, fontWeight: 700, margin: 0 }}>Documentos del Paciente</h1>
              <p style={{ color: '#5A5048', fontSize: 12, margin: '4px 0 0 0' }}>
                Módulo 12 — Generación de Documentos PDF (NOM-004 / NOM-151)
              </p>
            </div>
          </div>
          {documentos && (
            <span style={{ padding: '4px 12px', background: '#E3F2FD', color: '#2459A8', borderRadius: 6, fontSize: 12, fontWeight: 600 }}>
              {documentos.total} documento{documentos.total !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>

      {/* Filtros por tipo */}
      <div style={{ padding: '12px 28px', background: '#FDFAF5', borderBottom: '1px solid #DAD4CC', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {[
          { key: 'TODOS', label: 'Todos', emoji: '📁' },
          { key: 'NOTA_SOAP', label: 'Notas SOAP', emoji: '📋' },
          { key: 'RECETA', label: 'Recetas', emoji: '💊' },
          { key: 'SOLICITUD_ESTUDIO', label: 'Solicitudes', emoji: '🔬' },
          { key: 'REFERENCIA', label: 'Referencias', emoji: '📤' },
        ].map(f => (
          <button key={f.key} onClick={() => setFiltroTipo(f.key)}
            style={{
              padding: '6px 14px',
              border: `1.5px solid ${filtroTipo === f.key ? '#2459A8' : '#DAD4CC'}`,
              borderRadius: 20,
              background: filtroTipo === f.key ? '#E3F2FD' : '#fff',
              color: filtroTipo === f.key ? '#2459A8' : '#5A5048',
              fontSize: 12,
              fontWeight: filtroTipo === f.key ? 600 : 400,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}>
            {f.emoji} {f.label}
            {f.key !== 'TODOS' && documentos && (
              <span style={{ marginLeft: 4, opacity: 0.7 }}>
                ({f.key === 'NOTA_SOAP' ? documentos.notas?.length || 0 :
                  f.key === 'RECETA' ? documentos.recetas?.length || 0 :
                  f.key === 'SOLICITUD_ESTUDIO' ? documentos.solicitudes?.length || 0 :
                  documentos.referencias?.length || 0})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Contenido */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '28px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: '#5A5048' }}>⏳ Cargando documentos del paciente...</div>
        ) : error ? (
          <div style={{ textAlign: 'center', padding: 60 }}>
            <AlertCircle size={48} style={{ color: '#BA2E45', marginBottom: 16 }} />
            <p style={{ color: '#BA2E45', fontSize: 14 }}>{error}</p>
            <button onClick={loadDocumentos}
              style={{ marginTop: 16, padding: '8px 20px', background: '#2459A8', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13 }}>
              Reintentar
            </button>
          </div>
        ) : allDocs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, color: '#5A5048' }}>
            <Filter size={48} style={{ opacity: 0.3, marginBottom: 16 }} />
            <p style={{ fontSize: 14 }}>
              {filtroTipo !== 'TODOS'
                ? `No hay documentos de tipo "${tipoConfig[filtroTipo]?.label}" para este paciente`
                : 'No se encontraron documentos clínicos para este paciente'}
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {allDocs.map(doc => {
              const config = tipoConfig[doc.tipo_documento] || tipoConfig.NOTA_SOAP;
              const IconComponent = config.icon;

              return (
                <div key={`${doc.tipo_documento}-${doc.id}`}
                  style={{
                    padding: '14px 18px',
                    background: '#FDFAF5',
                    border: '1px solid #DAD4CC',
                    borderRadius: 10,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                    transition: 'border-color 0.2s',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.borderColor = config.color}
                  onMouseLeave={(e) => e.currentTarget.style.borderColor = '#DAD4CC'}
                >
                  {/* Icono tipo */}
                  <div style={{
                    width: 42, height: 42, borderRadius: 8,
                    background: config.bg, display: 'flex',
                    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <IconComponent size={20} style={{ color: config.color }} />
                  </div>

                  {/* Contenido */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{
                        fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
                        padding: '1px 8px', borderRadius: 4,
                        background: config.bg, color: config.color,
                      }}>
                        {config.label}
                      </span>

                      {/* Badges especiales según tipo */}
                      {doc.tipo_documento === 'NOTA_SOAP' && doc.firmada && (
                        <span style={{ fontSize: 10, fontWeight: 600, color: '#237A4B', display: 'flex', alignItems: 'center', gap: 2 }}>
                          <CheckCircle size={12} /> Firmada
                        </span>
                      )}
                      {doc.tipo_documento === 'NOTA_SOAP' && !doc.firmada && (
                        <span style={{ fontSize: 10, fontWeight: 600, color: '#E8921F', display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Clock size={12} /> Pendiente de firma
                        </span>
                      )}
                      {doc.tipo_documento === 'SOLICITUD_ESTUDIO' && (
                        <span style={{
                          fontSize: 10, fontWeight: 600,
                          color: doc.tiene_resultados ? '#237A4B' : '#E8921F',
                          display: 'flex', alignItems: 'center', gap: 2,
                        }}>
                          {doc.tiene_resultados
                            ? <><CheckCircle size={12} /> Con resultados ({doc.num_resultados})</>
                            : <><Clock size={12} /> Pendiente de resultado</>}
                        </span>
                      )}
                      {doc.tipo_documento === 'REFERENCIA' && doc.estado && (
                        <span style={{
                          fontSize: 10, fontWeight: 600,
                          color: doc.estado === 'EMITIDA' ? '#E8921F' :
                                 doc.estado === 'ACEPTADA' ? '#2459A8' :
                                 doc.estado === 'ATENDIDA' ? '#237A4B' : '#BA2E45',
                        }}>
                          {doc.estado}
                        </span>
                      )}
                    </div>

                    <p style={{ fontSize: 13, color: '#1A1510', margin: '0 0 4px 0', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {doc.descripcion}
                    </p>

                    <div style={{ display: 'flex', gap: 12, fontSize: 11, color: '#8A7F75' }}>
                      {doc.medico && <span>👨‍⚕️ {doc.medico}</span>}
                      {doc.fecha && <span>📅 {new Date(doc.fecha).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}</span>}
                    </div>
                  </div>

                  {/* Botón de descarga PDF */}
                  <button
                    onClick={() => handleDescargarPDF(doc)}
                    disabled={!doc.pdf_disponible || descargando === doc.id}
                    title={doc.pdf_disponible ? 'Descargar PDF' : 'PDF próximamente — Se implementará con WeasyPrint'}
                    style={{
                      padding: '8px 14px',
                      border: `1.5px solid ${doc.pdf_disponible ? config.color : '#DAD4CC'}`,
                      borderRadius: 6,
                      background: doc.pdf_disponible ? config.color : 'transparent',
                      color: doc.pdf_disponible ? '#fff' : '#8A7F75',
                      cursor: doc.pdf_disponible ? 'pointer' : 'not-allowed',
                      fontSize: 11,
                      fontWeight: 500,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      opacity: doc.pdf_disponible ? 1 : 0.5,
                      flexShrink: 0,
                      transition: 'all 0.2s',
                    }}
                  >
                    <Download size={14} />
                    {descargando === doc.id ? 'Descargando...' : 'PDF'}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

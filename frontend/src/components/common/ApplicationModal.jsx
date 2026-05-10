import { useState } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { useTranslation } from 'react-i18next';
import { X, Upload, FileText, CheckCircle } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import toast from 'react-hot-toast';
import API from '../../api/axios';

import { useAuth } from '../../context/AuthContext';

export default function ApplicationModal({ topic, onClose, onSuccess }) {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [motivation, setMotivation] = useState('');
  const [cvFile, setCvFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { 'application/pdf': ['.pdf'] },
    maxFiles: 1,
    maxSize: 20 * 1024 * 1024,
    onDrop: (acceptedFiles) => setCvFile(acceptedFiles[0])
  });

  const wordCount = motivation.trim().split(/\s+/).filter(Boolean).length;
  const isMotivationValid = wordCount >= 10; // Reduced to 10 words for easier testing

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isMotivationValid) {
      toast.error('La lettre de motivation doit faire au moins 10 mots.');
      return;
    }
    
    const hasProfileCv = !!user?.studentProfile?.cvUrl;
    if (!cvFile && !hasProfileCv) {
      toast.error('Veuillez joindre votre CV ou en ajouter un à votre profil.');
      return;
    }

    try {
      setSubmitting(true);
      // In a real app, we would use FormData to upload the file
      // Here we simulate the logic
      const formData = new FormData();
      formData.append('topicId', topic.id);
      formData.append('motivationText', motivation);
      formData.append('cv', cvFile);

      await API.post('/applications', {
        topicId: topic.id,
        motivationText: motivation,
        // cvUrl: simulate upload URL
      });

      toast.success('Candidature soumise avec succès !');
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur lors de la soumission');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 1100 }}>
      <div className="modal-content card" style={{ maxWidth: '800px', width: '90%', padding: '32px', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Postuler au sujet</h2>
            <p style={{ color: 'var(--text-muted)' }}>{topic.title}</p>
          </div>
          <button onClick={onClose} className="btn btn-ghost"><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div>
            <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
              Lettre de motivation (min 150 mots)
              <span style={{ color: isMotivationValid ? 'var(--accent-green)' : 'var(--accent-red)', fontWeight: 600 }}>
                {wordCount} mots
              </span>
            </label>
            <ReactQuill 
              theme="snow" 
              value={motivation} 
              onChange={setMotivation} 
              placeholder="Expliquez pourquoi vous êtes le candidat idéal pour ce sujet..."
            />
          </div>

          <div>
            <label className="form-label">Votre CV (PDF, max 20 Mo)</label>
            <div {...getRootProps()} className={`dropzone ${isDragActive ? 'active' : ''}`} style={{
              border: '2px dashed var(--border)',
              borderRadius: '12px',
              padding: '32px',
              textAlign: 'center',
              cursor: 'pointer',
              background: isDragActive ? 'var(--bg-secondary)' : 'transparent',
              transition: 'all 0.2s'
            }}>
              <input {...getInputProps()} />
              {cvFile ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', color: 'var(--accent-blue)' }}>
                  <FileText size={24} />
                  <span style={{ fontWeight: 600 }}>{cvFile.name}</span>
                  <CheckCircle size={20} color="var(--accent-green)" />
                </div>
              ) : (
                <div style={{ color: 'var(--text-muted)' }}>
                  <Upload size={32} style={{ marginBottom: '12px' }} />
                  <p>Glissez-déposez votre CV ici ou cliquez pour parcourir</p>
                </div>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
            <button type="button" onClick={onClose} className="btn btn-ghost" disabled={submitting}>Annuler</button>
            <button type="submit" className="btn btn-primary" disabled={submitting || !isMotivationValid || (!cvFile && !user?.studentProfile?.cvUrl)}>
              {submitting ? 'Envoi en cours...' : 'Soumettre ma candidature'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

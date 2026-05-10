import { useState, useEffect } from 'react';
import { X, Save, Upload, Plus, Trash2 } from 'lucide-react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import API from '../../api/axios';
import toast from 'react-hot-toast';
import LevelSelect from './LevelSelect';
import { getLevelLabel } from '../../constants/levels';

export default function TopicFormModal({ topic, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: topic?.title || '',
    description: topic?.description || '',
    requiredSkills: topic?.requiredSkills || '',
    type: topic?.type || 'PFE',
    duration: topic?.duration || '',
    domain: topic?.domain || '',
    places: topic?.places || 1,
    requiredLevel: topic?.requiredLevel || 'M2',
    descriptionPdfUrl: topic?.descriptionPdfUrl || '',
    salary: topic?.salary || '',
    workAddress: topic?.workAddress || '',
    contactPerson: topic?.contactPerson || '',
    applicationDeadline: topic?.applicationDeadline ? topic.applicationDeadline.split('T')[0] : ''
  });

  const [skills, setSkills] = useState(topic?.requiredSkills ? topic.requiredSkills.split(',').filter(Boolean) : []);
  const [newSkill, setNewSkill] = useState('');

  const handleAddSkill = (e) => {
    e.preventDefault();
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      setSkills([...skills, newSkill.trim()]);
      setNewSkill('');
    }
  };

  const removeSkill = (skill) => {
    setSkills(skills.filter(s => s !== skill));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const payload = { ...formData, requiredSkills: skills.join(',') };
      
      if (topic?.id) {
        await API.put(`/topics/${topic.id}`, payload);
        toast.success('Sujet mis à jour');
      } else {
        await API.post('/topics', payload);
        toast.success('Sujet créé et envoyé pour validation');
      }
      
      onSuccess();
      onClose();
    } catch {
      toast.error('Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content card" style={{ maxWidth: '800px', width: '95%', maxHeight: '90vh', overflowY: 'auto', padding: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>{topic ? 'Modifier le sujet' : 'Proposer un nouveau sujet'}</h2>
          <button onClick={onClose} className="btn btn-ghost"><X size={24} /></button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          
          <div className="form-group" style={{ gridColumn: 'span 2' }}>
            <label className="form-label">Titre du sujet</label>
            <input 
              type="text" required className="form-input" 
              value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} 
              placeholder="Ex: Optimisation des réseaux de neurones pour l'Edge Computing"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Type</label>
            <select className="form-input" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
              <option value="PFE">PFE</option>
              <option value="INTERNSHIP">Stage</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Domaine / Filière</label>
            <input type="text" className="form-input" value={formData.domain} onChange={e => setFormData({...formData, domain: e.target.value})} placeholder="Ex: IA, Web, Cloud..." />
          </div>

          <div className="form-group">
            <label className="form-label">Niveau requis</label>
            <LevelSelect 
              value={formData.requiredLevel} 
              onChange={e => setFormData({...formData, requiredLevel: e.target.value})} 
            />
          </div>

          <div className="form-group">
             <label className="form-label">Nombre de places</label>
             <input type="number" min="1" className="form-input" value={formData.places} onChange={e => setFormData({...formData, places: parseInt(e.target.value)})} />
          </div>

          <div className="form-group">
            <label className="form-label">Durée (mois)</label>
            <input type="text" className="form-input" value={formData.duration} onChange={e => setFormData({...formData, duration: e.target.value})} placeholder="Ex: 4 à 6 mois" />
          </div>

          <div className="form-group">
             <label className="form-label">Pièce jointe (Lien PDF)</label>
             <input type="text" className="form-input" value={formData.descriptionPdfUrl} onChange={e => setFormData({...formData, descriptionPdfUrl: e.target.value})} placeholder="URL du document descriptif" />
          </div>

          <div className="form-group">
             <label className="form-label">Rémunération (optionnel)</label>
             <input type="text" className="form-input" value={formData.salary} onChange={e => setFormData({...formData, salary: e.target.value})} placeholder="Ex: 1000 DT / mois" />
          </div>

          <div className="form-group">
             <label className="form-label">Lieu de travail</label>
             <input type="text" className="form-input" value={formData.workAddress} onChange={e => setFormData({...formData, workAddress: e.target.value})} placeholder="Adresse du stage" />
          </div>

          <div className="form-group">
             <label className="form-label">Contact (Responsable)</label>
             <input type="text" className="form-input" value={formData.contactPerson} onChange={e => setFormData({...formData, contactPerson: e.target.value})} placeholder="Nom du tuteur entreprise" />
          </div>

          <div className="form-group">
             <label className="form-label">Date limite candidature</label>
             <input type="date" className="form-input" value={formData.applicationDeadline} onChange={e => setFormData({...formData, applicationDeadline: e.target.value})} />
          </div>

          <div className="form-group" style={{ gridColumn: 'span 2' }}>
             <label className="form-label">Description détaillée</label>
             <ReactQuill 
                theme="snow" 
                value={formData.description} 
                onChange={(content) => setFormData({...formData, description: content})} 
                style={{ height: '200px', marginBottom: '50px' }}
             />
          </div>

          <div className="form-group" style={{ gridColumn: 'span 2' }}>
            <label className="form-label">Technologies requises</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
               {skills.map(skill => (
                 <span key={skill} className="badge" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                   {skill} <X size={12} style={{ cursor: 'pointer' }} onClick={() => removeSkill(skill)} />
                 </span>
               ))}
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input 
                type="text" className="form-input" 
                value={newSkill} onChange={e => setNewSkill(e.target.value)} 
                placeholder="Ajouter une technologie..." 
                onKeyPress={e => e.key === 'Enter' && handleAddSkill(e)}
              />
              <button type="button" onClick={handleAddSkill} className="btn btn-ghost"><Plus size={18} /></button>
            </div>
          </div>

          <div style={{ gridColumn: 'span 2', display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
            <button type="button" onClick={onClose} className="btn btn-ghost">Annuler</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              <Save size={18} /> {topic ? 'Mettre à jour' : 'Soumettre le sujet'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}

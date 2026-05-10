import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  Globe, MapPin, Users, Briefcase, Mail, 
  ExternalLink, ChevronRight, Star, Building2
} from 'lucide-react';
import { motion } from 'framer-motion';
import API from '../api/axios';
import toast from 'react-hot-toast';
import TopicCard from '../components/common/TopicCard';

export default function CompanyPublicProfile() {
  const { id } = useParams();
  const [company, setCompany] = useState(null);
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCompanyData();
  }, [id]);

  const fetchCompanyData = async () => {
    try {
      setLoading(true);
      // We'll use a generic endpoint or fetch from topic owner
      const res = await API.get(`/users/${id}`); 
      setCompany(res.data.company);
      const topicsRes = await API.get(`/topics`); // Uses the general endpoint visible to all roles
      setTopics(topicsRes.data.filter(t => t.createdById === parseInt(id) && t.status === 'APPROVED'));
    } catch {
      toast.error('Erreur lors du chargement du profil');
    } finally {
      setLoading(false);
    }
  };

  if (loading || !company) return <div className="loading-state">Chargement du profil entreprise...</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      
      {/* Hero Section */}
      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        <div style={{ height: '160px', background: 'linear-gradient(135deg, var(--accent-blue) 0%, var(--accent-blue-soft) 100%)' }}></div>
        <div style={{ padding: '0 32px 32px', marginTop: '-48px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '20px' }}>
            <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-end' }}>
              <div style={{ width: '120px', height: '120px', borderRadius: '16px', background: 'white', border: '4px solid white', boxShadow: 'var(--shadow-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                {company.logoUrl ? <img src={company.logoUrl} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} /> : <Building2 size={64} color="var(--text-muted)" />}
              </div>
              <div style={{ paddingBottom: '8px' }}>
                <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '8px' }}>{company.companyName}</h1>
                <div style={{ display: 'flex', gap: '16px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                   <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><MapPin size={16}/> {company.address}</span>
                   <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Globe size={16}/> {company.sector}</span>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px', paddingBottom: '8px' }}>
               {company.website && (
                 <a href={company.website} target="_blank" rel="noreferrer" className="btn btn-ghost">
                   <ExternalLink size={18} /> Site web
                 </a>
               )}
               <button className="btn btn-primary">Suivre l'entreprise</button>
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '32px' }}>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          {/* About */}
          <section>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '16px' }}>À propos de nous</h3>
            <div className="card" style={{ padding: '24px', lineHeight: 1.7, color: 'var(--text-secondary)' }}>
              {company.description || "Aucune description fournie."}
            </div>
          </section>

          {/* Active Offers */}
          <section>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
               <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Offres de stage actives</h3>
               <span className="badge" style={{ background: 'var(--accent-blue-soft)', color: 'var(--accent-blue)' }}>{topics.length} postes</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
              {topics.map(topic => (
                <TopicCard key={topic.id} topic={topic} onClick={() => {}} />
              ))}
            </div>
          </section>
        </div>

        {/* Sidebar Info */}
        <aside style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
           <div className="card" style={{ padding: '24px' }}>
              <h4 style={{ fontWeight: 700, marginBottom: '20px' }}>Informations clés</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                 <div style={{ display: 'flex', gap: '12px' }}>
                    <Users size={20} color="var(--accent-blue)" />
                    <div>
                       <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Taille de l'entreprise</p>
                       <p style={{ fontWeight: 600 }}>{company.size || 'Non spécifié'} employés</p>
                    </div>
                 </div>
                 <div style={{ display: 'flex', gap: '12px' }}>
                    <Star size={20} color="var(--accent-yellow)" />
                    <div>
                       <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Expertises</p>
                       <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '4px' }}>
                          {company.expertise?.split(',').map(ex => (
                            <span key={ex} className="badge" style={{ fontSize: '0.65rem' }}>{ex.trim()}</span>
                          ))}
                       </div>
                    </div>
                 </div>
              </div>
           </div>

           <div className="card" style={{ padding: '24px', background: 'var(--bg-secondary)' }}>
              <h4 style={{ fontWeight: 700, marginBottom: '12px' }}>Vous recrutez ?</h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
                Découvrez comment notre plateforme peut vous aider à trouver vos futurs talents.
              </p>
              <button className="btn btn-sm btn-ghost" style={{ width: '100%' }}>En savoir plus</button>
           </div>
        </aside>

      </div>
    </div>
  );
}

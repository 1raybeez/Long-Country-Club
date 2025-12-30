// components/ManagerGrid.tsx
import React from 'react';
// We import the data from the lib folder we just made
import { teams } from '../lib/managersData'; 

const ManagerGrid = () => {
  return (
    <div style={styles.gridContainer}>
      {teams.map((team) => (
        <div key={team.name} style={styles.card}>
          
          {/* Image Wrapper */}
          <div style={styles.imageWrapper}>
            {team.images.map((imgSrc, index) => (
              <img 
                key={index}
                src={imgSrc} 
                alt={`${team.name} ${index + 1}`} 
                // Logic: If 2 images, show them smaller side-by-side. If 1, show it large.
                style={team.images.length > 1 ? styles.smallImage : styles.largeImage} 
              />
            ))}
          </div>

          <h3 style={styles.name}>{team.name}</h3>
        </div>
      ))}
    </div>
  );
};

// Basic CSS styles written in JavaScript
const styles = {
  gridContainer: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', // Responsive grid
    gap: '20px',
    padding: '20px',
    maxWidth: '1200px',
    margin: '0 auto',
  },
  card: {
    border: '1px solid #e5e7eb',
    borderRadius: '12px',
    padding: '15px',
    textAlign: 'center' as const,
    backgroundColor: '#ffffff',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
  },
  imageWrapper: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '10px',
    height: '110px', // Keeps cards consistent height
  },
  largeImage: {
    width: '100px',
    height: '100px',
    objectFit: 'cover' as const,
    borderRadius: '50%',
    border: '2px solid #333',
  },
  smallImage: {
    width: '70px',
    height: '70px',
    objectFit: 'cover' as const,
    borderRadius: '50%',
    border: '2px solid #333',
  },
  name: {
    margin: '0',
    fontSize: '1rem',
    fontWeight: 'bold',
    color: '#333',
  }
};

export default ManagerGrid;
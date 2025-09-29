/**
 * CSS styles for SchoolMenu component
 */
export const schoolMenuStyles = `
    :host {
        display: block;
        font-family: inherit;
        line-height: 1.6;
    }
    
    .menu-container {
        margin: 0;
        background: #fff;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        overflow: hidden;
    }
    
    .menu-title {
        margin: 0;
        padding: 1rem 1.5rem;
        font-size: 1.25rem;
        font-weight: 600;
        color: #2c3e50;
        background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
        border-bottom: 1px solid #dee2e6;
    }
    
    .menu-list {
        list-style: none;
        padding: 0;
        margin: 0;
    }
    
    .menu-item {
        padding: 0.75rem 1.5rem;
        border-bottom: 1px solid #f1f3f4;
        transition: background-color 0.2s ease;
        display: flex;
        align-items: flex-start;
        gap: 0.5rem;
    }
    
    .menu-item:hover {
        background-color: #f8f9fa;
    }
    
    .menu-item:last-child {
        border-bottom: none;
    }
    
    .day-name {
        font-weight: 600;
        color: #495057;
        min-width: 4rem;
        flex-shrink: 0;
    }
    
    .meals {
        color: #6c757d;
        flex: 1;
    }
    
    .today {
        background-color: #fff5f5;
        border-left: 4px solid #dc3545;
        padding-left: calc(1.5rem - 4px);
    }
    
    .today .day-name {
        color: #dc3545;
        font-weight: 700;
    }
    
    .today .meals {
        color: #721c24;
        font-weight: 500;
    }
    
    .loading, .error {
        padding: 2rem;
        text-align: center;
        color: #6c757d;
        font-style: italic;
    }
    
    .error {
        color: #dc3545;
        background-color: #f8d7da;
        border: 1px solid #f5c6cb;
        border-radius: 4px;
        margin: 1rem;
    }
    
    .loading::before {
        content: "⏳ ";
        margin-right: 0.5rem;
    }
    
    .error::before {
        content: "⚠️ ";
        margin-right: 0.5rem;
    }
    
    .menu-meta {
        padding: 0.5rem 1.5rem;
        font-size: 0.875rem;
        color: #6c757d;
        background-color: #f8f9fa;
        border-top: 1px solid #dee2e6;
        text-align: center;
    }
    
    /* Responsive design */
    @media (max-width: 768px) {
        .menu-container {
            border-radius: 0;
            box-shadow: none;
            border-top: 1px solid #dee2e6;
            border-bottom: 1px solid #dee2e6;
        }
        
        .menu-title {
            padding: 0.75rem 1rem;
            font-size: 1.125rem;
        }
        
        .menu-item {
            padding: 0.5rem 1rem;
            flex-direction: column;
            gap: 0.25rem;
        }
        
        .day-name {
            min-width: auto;
        }
        
        .today {
            padding-left: calc(1rem - 4px);
        }
    }
    
    /* Print styles */
    @media print {
        .menu-container {
            box-shadow: none;
            border: 1px solid #000;
        }
        
        .today {
            background-color: #f0f0f0 !important;
            border-left-color: #000 !important;
        }
    }
    
    /* High contrast mode */
    @media (prefers-contrast: high) {
        .menu-container {
            border: 2px solid #000;
        }
        
        .menu-item {
            border-bottom-color: #000;
        }
        
        .today {
            border-left-color: #000;
            background-color: #fff;
        }
        
        .today .day-name,
        .today .meals {
            color: #000;
        }
    }
    
    /* Reduced motion */
    @media (prefers-reduced-motion: reduce) {
        .menu-item {
            transition: none;
        }
    }
`;
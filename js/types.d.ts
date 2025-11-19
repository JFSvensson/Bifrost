/**
 * Global type declarations for Bifrost application
 * Extends the Window interface with custom properties
 */

interface Window {
    addTodo: () => void;
    toggleTodo: (id: string) => void;
    removeTodo: (id: string) => void;
}

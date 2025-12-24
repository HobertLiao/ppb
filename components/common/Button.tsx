import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger';
}

const Button: React.FC<ButtonProps> = ({ children, onClick, variant = 'primary', className, ...props }) => {
  const baseClasses = "px-6 py-3 text-lg rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors duration-200 w-full font-bold tracking-wide disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variantClasses = {
    primary: 'bg-green-700 hover:bg-green-800 text-white focus:ring-green-500',
    secondary: 'bg-purple-700 hover:bg-purple-800 text-white focus:ring-purple-500',
    danger: 'bg-transparent border-2 border-red-500 text-red-500 hover:bg-red-500 hover:text-white focus:ring-red-400',
  };

  return (
    <button className={`${baseClasses} ${variantClasses[variant]} ${className || ''}`} onClick={onClick} {...props}>
      {children}
    </button>
  );
};

export default Button;
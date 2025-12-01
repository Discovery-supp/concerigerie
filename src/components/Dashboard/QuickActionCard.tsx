import React from 'react';

interface QuickActionCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
  color: 'blue' | 'green' | 'orange' | 'purple' | 'gray' | 'red';
}

const QuickActionCard: React.FC<QuickActionCardProps> = ({ icon, title, description, onClick, color }) => {
  const colorClasses = {
    blue: 'border-blue-200 hover:border-blue-400 hover:bg-blue-50',
    green: 'border-green-200 hover:border-green-400 hover:bg-green-50',
    orange: 'border-orange-200 hover:border-orange-400 hover:bg-orange-50',
    purple: 'border-purple-200 hover:border-purple-400 hover:bg-purple-50',
    gray: 'border-gray-200 hover:border-gray-400 hover:bg-gray-50',
    red: 'border-red-200 hover:border-red-400 hover:bg-red-50'
  };

  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-6 bg-white rounded-xl border-2 ${colorClasses[color]} transition-all shadow-sm hover:shadow-md`}
    >
      <div className="flex items-start">
        <div className="flex-shrink-0">{icon}</div>
        <div className="ml-4 flex-1">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <p className="mt-1 text-sm text-gray-600">{description}</p>
        </div>
      </div>
    </button>
  );
};

export default QuickActionCard;


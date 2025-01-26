import React from 'react';

const App = () => {
  return (
    <div className="flex flex-col md:flex-row items-center justify-between bg-gray-800 p-6 rounded-lg text-white max-w-4xl mx-auto">
      {/* Summary Text Section */}
      <div className="bg-gray-600 p-4 rounded-lg flex-1 mb-4 md:mb-0 md:mr-4 h-48 overflow-y-scroll scrollbar-custom">
        <h3 className="text-lg font-bold mb-2">Summary Text</h3>
        <p className="text-sm">
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. 
        </p>
        <p className="text-sm">
          Additional content to demonstrate scrolling behavior. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
        </p>
      </div>

      {/* Right Section */}
      <div className="flex flex-col items-center space-y-4">
        <div className="bg-gray-700 md: h-33 p-4 rounded-lg w-full text-center">
          Summary Properties
        </div>
        <button className="bg-green-500 hover:bg-green-600 text-white py-2 px-6 rounded-lg w-full">
          Summarize
        </button>
      </div>
    </div>
  );
};

export default App;

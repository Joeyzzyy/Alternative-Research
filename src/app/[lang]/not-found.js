import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-9xl font-bold text-gray-800">404</h1>
        
        <div className="animate-bounce mt-4">
          <span className="text-6xl">🔍</span>
        </div>
        
        <h2 className="text-2xl md:text-3xl font-semibold text-gray-700 mt-8">
          Page Not Found
        </h2>
        
        <p className="text-gray-600 mt-4 mb-8">
          Oops! The page you are looking for might have been removed or is temporarily unavailable.
        </p>
        
        <Link 
          href="https://websitelm.com/" 
          className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 
                     text-white rounded-lg transition-colors duration-200
                     transform hover:scale-105"
        >
          Back to WebsiteLM
        </Link>
      </div>
    </div>
  );
}
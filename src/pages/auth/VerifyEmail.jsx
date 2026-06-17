import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../../services/api';

const VerifyEmail = () => {
  const { token } = useParams();
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [verifying, setVerifying] = useState(true);

  useEffect(() => {
    const verify = async () => {
      try {
        const response = await api.verifyEmail(token);
        setMessage(response.data.message || 'Email successfully verified!');
      } catch (err) {
        setError(err.response?.data?.message || 'Error verifying email or token expired.');
      } finally {
        setVerifying(false);
      }
    };
    verify();
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-sm border border-gray-100 text-center">
        <h2 className="mt-6 text-3xl font-extrabold text-gray-900">Email Verification</h2>
        
        {verifying ? (
          <p className="text-gray-600">Verifying your email address...</p>
        ) : (
          <div className="mt-4">
            {message && <div className="bg-green-50 text-green-600 p-4 rounded-md mb-4">{message}</div>}
            {error && <div className="bg-red-50 text-red-600 p-4 rounded-md mb-4">{error}</div>}
            <Link 
              to="/auth/login/patient" 
              className="inline-flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              Continue to Login
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default VerifyEmail;

import React, { useState, useEffect } from 'react';
import Button from './Button';
import Icon from '../AppIcon';
import Image from '../AppImage';

const ConversionModal = ({ isOpen, type, templateData, onClose }) => {
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    company: '',
    useCase: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState(1);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setStep(1);
      setFormData({ email: '', name: '', company: '', useCase: '' });
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e?.target?.name]: e?.target?.value
    });
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    setIsSubmitting(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));

    setIsSubmitting(false);
    setStep(2);
  };

  const renderSignupModal = () => (
    <div className="max-w-md w-full">
      {step === 1 ? (
        <div className="bg-white rounded-2xl p-8 shadow-2xl">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Icon name="Zap" size={24} className="text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Start Creating Free</h2>
            <p className="text-slate-600">Join 150,000+ designers using Mockup Gen</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                value={formData?.email}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="your@email.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Full Name
              </label>
              <input
                type="text"
                name="name"
                value={formData?.name}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="John Doe"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Company (Optional)
              </label>
              <input
                type="text"
                name="company"
                value={formData?.company}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Your Company"
              />
            </div>

            <Button
              type="submit"
              variant="default"
              fullWidth
              loading={isSubmitting}
              className="shadow-cta"
            >
              {isSubmitting ? 'Creating Account...' : 'Create Free Account'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <div className="flex items-center space-x-4 text-sm text-slate-500">
              <div className="flex items-center space-x-1">
                <Icon name="Shield" size={14} />
                <span>No credit card</span>
              </div>
              <div className="flex items-center space-x-1">
                <Icon name="Clock" size={14} />
                <span>30 sec setup</span>
              </div>
              <div className="flex items-center space-x-1">
                <Icon name="Check" size={14} />
                <span>Free forever</span>
              </div>
            </div>
          </div>

          <p className="text-xs text-slate-500 text-center mt-4">
            By signing up, you agree to our{' '}
            <a href="/terms" className="text-blue-600 hover:underline">Terms</a> and{' '}
            <a href="/privacy" className="text-blue-600 hover:underline">Privacy Policy</a>
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl p-8 shadow-2xl text-center">
          <div className="w-16 h-16 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Icon name="Check" size={24} className="text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Welcome to Mockup Gen!</h2>
          <p className="text-slate-600 mb-6">
            Your account has been created. Check your email for login instructions.
          </p>
          <Button
            variant="default"
            fullWidth
            onClick={onClose}
            iconName="ArrowRight"
            iconPosition="right"
          >
            Start Creating Mockups
          </Button>
        </div>
      )}
    </div>
  );

  const renderDemoModal = () => (
    <div className="max-w-4xl w-full">
      <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Mockup Gen Demo</h2>
              <p className="text-slate-600">See how easy it is to create professional mockups</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <Icon name="X" size={20} className="text-slate-400" />
            </button>
          </div>
        </div>
        
        <div className="aspect-video bg-slate-900 flex items-center justify-center">
          <div className="text-center text-white">
            <Icon name="Play" size={64} className="mx-auto mb-4 opacity-80" />
            <h3 className="text-xl font-semibold mb-2">Demo Video</h3>
            <p className="text-slate-300">Watch how Mockup Gen works in 2 minutes</p>
          </div>
        </div>
        
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div className="text-sm text-slate-600">
              Duration: 2:30 | 4K Quality Available
            </div>
            <Button
              variant="default"
              onClick={onClose}
              iconName="Zap"
              iconPosition="left"
            >
              Try It Free
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderTemplatePreview = () => (
    <div className="max-w-2xl w-full">
      <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900">{templateData?.name}</h2>
              <p className="text-slate-600 capitalize">{templateData?.category} Template</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <Icon name="X" size={20} className="text-slate-400" />
            </button>
          </div>
        </div>
        
        <div className="p-8">
          <div className="aspect-[4/3] bg-gradient-to-br from-slate-100 to-slate-200 rounded-xl mb-6 flex items-center justify-center">
            {templateData?.preview && (
              <Image
                src={templateData?.preview}
                alt={templateData?.name}
                className="max-w-full max-h-full object-contain"
              />
            )}
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <h4 className="font-medium text-slate-900 mb-2">Available Colors</h4>
              <div className="flex space-x-2">
                {templateData?.colors?.slice(0, 4)?.map((color, index) => (
                  <div
                    key={index}
                    className="w-8 h-8 bg-slate-300 rounded-full border-2 border-white shadow-sm"
                    title={color}
                  />
                ))}
                {templateData?.colors?.length > 4 && (
                  <div className="w-8 h-8 bg-slate-600 rounded-full border-2 border-white shadow-sm flex items-center justify-center">
                    <span className="text-white text-xs font-bold">+{templateData?.colors?.length - 4}</span>
                  </div>
                )}
              </div>
            </div>
            <div>
              <h4 className="font-medium text-slate-900 mb-2">Export Formats</h4>
              <div className="flex space-x-2 text-sm text-slate-600">
                <span className="bg-slate-100 px-2 py-1 rounded">PNG</span>
                <span className="bg-slate-100 px-2 py-1 rounded">JPG</span>
                <span className="bg-slate-100 px-2 py-1 rounded">PDF</span>
              </div>
            </div>
          </div>
          
          <div className="flex space-x-3">
            <Button
              variant="default"
              fullWidth
              iconName="Zap"
              iconPosition="left"
              className="shadow-cta"
            >
              Use This Template
            </Button>
            <Button
              variant="outline"
              iconName="Heart"
              iconPosition="left"
            >
              Save
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="relative max-h-[90vh] overflow-y-auto">
        {type === 'signup' && renderSignupModal()}
        {type === 'demo' && renderDemoModal()}
        {type === 'template-preview' && renderTemplatePreview()}
        
        {/* Close button for non-signup modals */}
        {type !== 'signup' && (
          <button
            onClick={onClose}
            className="absolute -top-4 -right-4 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-slate-50 transition-colors"
          >
            <Icon name="X" size={16} className="text-slate-400" />
          </button>
        )}
      </div>
    </div>
  );
};

export default ConversionModal;
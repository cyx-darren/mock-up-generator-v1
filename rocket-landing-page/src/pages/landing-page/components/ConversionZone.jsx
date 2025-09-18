import React, { useState, useEffect } from 'react';
import Button from '../../../components/ui/Button';
import Icon from '../../../components/AppIcon';

const ConversionZone = ({ onSignupClick }) => {
  const [timeLeft, setTimeLeft] = useState({
    hours: 23,
    minutes: 45,
    seconds: 30
  });
  const [isNewVisitor, setIsNewVisitor] = useState(true);
  const [userType, setUserType] = useState('new'); // 'new', 'returning', 'price-sensitive'

  useEffect(() => {
    // Check if user is returning visitor
    const hasVisited = localStorage.getItem('mockupgen_visited');
    const lastVisit = localStorage.getItem('mockupgen_last_visit');
    
    if (hasVisited) {
      setIsNewVisitor(false);
      const daysSinceLastVisit = (Date.now() - parseInt(lastVisit)) / (1000 * 60 * 60 * 24);
      
      if (daysSinceLastVisit > 7) {
        setUserType('returning');
      } else {
        setUserType('price-sensitive');
      }
    } else {
      localStorage.setItem('mockupgen_visited', 'true');
      localStorage.setItem('mockupgen_last_visit', Date.now()?.toString());
    }

    // Countdown timer
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        let { hours, minutes, seconds } = prev;
        
        if (seconds > 0) {
          seconds--;
        } else if (minutes > 0) {
          minutes--;
          seconds = 59;
        } else if (hours > 0) {
          hours--;
          minutes = 59;
          seconds = 59;
        }
        
        return { hours, minutes, seconds };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const getOfferContent = () => {
    switch (userType) {
      case 'returning':
        return {
          badge: 'Welcome Back!',
          title: 'Ready to Create Amazing Mockups?',
          subtitle: 'Your designs deserve professional presentation',
          offer: 'Claim Your 25% Discount',
          urgency: 'Limited time offer for returning visitors',
          cta: 'Claim Discount & Start Creating',
          benefits: [
            'All Pro features unlocked',
            'Unlimited mockup generation',
            '500+ device templates',
            'No watermarks ever'
          ]
        };
      case 'price-sensitive':
        return {
          badge: 'Special Offer',
          title: 'Extended Free Trial',
          subtitle: 'Try Pro features risk-free for 30 days',
          offer: '30-Day Free Trial',
          urgency: 'No credit card required',
          cta: 'Start Extended Trial',
          benefits: [
            '30 days of Pro features',
            'Unlimited mockups',
            'All device templates',
            'Cancel anytime'
          ]
        };
      default:
        return {
          badge: 'Limited Time',
          title: 'Transform Your Design Workflow Today',
          subtitle: 'Join 150,000+ designers creating professional mockups',
          offer: '50% Off First Month',
          urgency: 'New user exclusive - expires soon',
          cta: 'Start Creating Free',
          benefits: [
            'Instant mockup generation',
            '500+ device templates',
            'Professional quality output',
            '14-day free trial'
          ]
        };
    }
  };

  const content = getOfferContent();

  const formatTime = (time) => {
    return time?.toString()?.padStart(2, '0');
  };

  return (
    <section className="py-20 bg-gradient-to-br from-blue-900 via-purple-900 to-slate-900 text-white relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500 rounded-full opacity-10 blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500 rounded-full opacity-10 blur-3xl"></div>
      </div>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Offer Badge */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 rounded-full text-sm font-medium mb-6">
            <Icon name="Zap" size={16} className="mr-2" />
            {content?.badge}
          </div>
        </div>

        {/* Main Content */}
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6">
            {content?.title}
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            {content?.subtitle}
          </p>

          {/* Offer Highlight */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 mb-8 border border-white/20">
            <div className="text-center">
              <div className="text-4xl font-bold text-yellow-400 mb-2">
                {content?.offer}
              </div>
              <p className="text-blue-100 mb-6">{content?.urgency}</p>

              {/* Countdown Timer */}
              {userType === 'new' && (
                <div className="flex justify-center space-x-4 mb-6">
                  <div className="bg-white/20 rounded-lg p-3 min-w-[60px]">
                    <div className="text-2xl font-bold">{formatTime(timeLeft?.hours)}</div>
                    <div className="text-xs text-blue-200">Hours</div>
                  </div>
                  <div className="bg-white/20 rounded-lg p-3 min-w-[60px]">
                    <div className="text-2xl font-bold">{formatTime(timeLeft?.minutes)}</div>
                    <div className="text-xs text-blue-200">Minutes</div>
                  </div>
                  <div className="bg-white/20 rounded-lg p-3 min-w-[60px]">
                    <div className="text-2xl font-bold">{formatTime(timeLeft?.seconds)}</div>
                    <div className="text-xs text-blue-200">Seconds</div>
                  </div>
                </div>
              )}

              {/* Benefits */}
              <div className="grid sm:grid-cols-2 gap-4 mb-8">
                {content?.benefits?.map((benefit, index) => (
                  <div key={index} className="flex items-center space-x-3 text-left">
                    <Icon name="Check" size={16} className="text-green-400 flex-shrink-0" />
                    <span className="text-blue-100">{benefit}</span>
                  </div>
                ))}
              </div>

              {/* CTA Button */}
              <Button
                variant="default"
                size="lg"
                onClick={onSignupClick}
                className="bg-gradient-to-r from-yellow-400 to-orange-500 text-slate-900 hover:from-yellow-300 hover:to-orange-400 shadow-2xl text-lg px-8 py-4 font-bold"
                iconName="ArrowRight"
                iconPosition="right"
              >
                {content?.cta}
              </Button>

              {/* Trust Indicators */}
              <div className="flex items-center justify-center space-x-6 mt-6 text-sm text-blue-200">
                <div className="flex items-center space-x-1">
                  <Icon name="Shield" size={16} />
                  <span>No credit card required</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Icon name="Clock" size={16} />
                  <span>Setup in 30 seconds</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Icon name="RefreshCw" size={16} />
                  <span>Cancel anytime</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Social Proof */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="text-center">
            <div className="text-3xl font-bold text-yellow-400 mb-2">2M+</div>
            <div className="text-blue-200">Mockups Created</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-400 mb-2">150K+</div>
            <div className="text-blue-200">Happy Users</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-400 mb-2">4.9/5</div>
            <div className="text-blue-200">User Rating</div>
          </div>
        </div>

        {/* Testimonial */}
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
              <Icon name="User" size={20} />
            </div>
            <div className="flex-1">
              <blockquote className="text-blue-100 italic mb-2">
                "Mockup Gen saved me 15+ hours per week. The quality is incredible and clients love the professional presentations."
              </blockquote>
              <cite className="text-sm text-blue-300">
                — Sarah Chen, Senior UX Designer at Spotify
              </cite>
            </div>
          </div>
        </div>

        {/* Risk Reversal */}
        <div className="text-center mt-12">
          <div className="inline-flex items-center space-x-2 text-green-400 mb-4">
            <Icon name="Shield" size={20} />
            <span className="font-semibold">30-Day Money-Back Guarantee</span>
          </div>
          <p className="text-blue-200 text-sm max-w-2xl mx-auto">
            Try Mockup Gen risk-free. If you're not completely satisfied with the results, 
            we'll refund your money within 30 days. No questions asked.
          </p>
        </div>

        {/* Exit Intent Trigger (Hidden) */}
        <div className="hidden" id="exit-intent-trigger">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-8 max-w-md w-full text-slate-900">
              <div className="text-center">
                <Icon name="Gift" size={48} className="mx-auto mb-4 text-blue-600" />
                <h3 className="text-2xl font-bold mb-4">Wait! Don't Leave Empty-Handed</h3>
                <p className="text-slate-600 mb-6">
                  Get our exclusive template pack with 50 premium device mockups - FREE!
                </p>
                <Button
                  variant="default"
                  fullWidth
                  className="mb-4"
                  iconName="Download"
                  iconPosition="left"
                >
                  Download Free Template Pack
                </Button>
                <button className="text-sm text-slate-500 hover:text-slate-700">
                  No thanks, I'll pass
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ConversionZone;
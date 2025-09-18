import React, { useState } from 'react';
import Button from '../../../components/ui/Button';
import Icon from '../../../components/AppIcon';


const IntegrationSection = () => {
  const [activeIntegration, setActiveIntegration] = useState('figma');

  const integrations = [
    {
      id: 'figma',
      name: 'Figma',
      description: 'Export designs directly from Figma to Mockup Gen with our official plugin.',
      logo: 'https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=80&h=80&fit=crop',
      color: 'bg-purple-500',
      features: [
        'One-click export from Figma',
        'Maintains design fidelity',
        'Batch export multiple artboards',
        'Auto-sync with team libraries'
      ],
      workflow: [
        'Select your Figma design',
        'Choose device template',
        'Export to Mockup Gen',
        'Download professional mockup'
      ],
      stats: { users: '50K+', rating: 4.9 }
    },
    {
      id: 'sketch',
      name: 'Sketch',
      description: 'Seamless integration with Sketch through our native plugin and API.',
      logo: 'https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=80&h=80&fit=crop',
      color: 'bg-orange-500',
      features: [
        'Native Sketch plugin',
        'Symbol library sync',
        'Artboard auto-detection',
        'Version control support'
      ],
      workflow: [
        'Install Mockup Gen plugin',
        'Select artboards in Sketch',
        'Choose mockup templates',
        'Generate and download'
      ],
      stats: { users: '25K+', rating: 4.8 }
    },
    {
      id: 'adobe',
      name: 'Adobe Creative Suite',
      description: 'Works with Photoshop, Illustrator, and XD through our Creative Cloud extension.',
      logo: 'https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=80&h=80&fit=crop',
      color: 'bg-red-500',
      features: [
        'Creative Cloud extension',
        'Multi-app support',
        'Layer preservation',
        'Smart object integration'
      ],
      workflow: [
        'Open Creative Cloud extension',
        'Select design layers',
        'Apply mockup templates',
        'Export high-res files'
      ],
      stats: { users: '75K+', rating: 4.7 }
    },
    {
      id: 'api',
      name: 'REST API',
      description: 'Integrate mockup generation into your own applications and workflows.',
      logo: 'https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=80&h=80&fit=crop',
      color: 'bg-blue-500',
      features: [
        'RESTful API endpoints',
        'Webhook support',
        'Bulk processing',
        'Custom template upload'
      ],
      workflow: [
        'Send design via API',
        'Specify template parameters',
        'Receive webhook notification',
        'Download generated mockup'
      ],
      stats: { users: '10K+', rating: 4.9 }
    }
  ];

  const workflowSteps = [
    {
      step: 1,
      title: 'Connect Your Tool',
      description: 'Install our plugin or connect via API',
      icon: 'Link'
    },
    {
      step: 2,
      title: 'Select Design',
      description: 'Choose your design or artboard',
      icon: 'MousePointer'
    },
    {
      step: 3,
      title: 'Pick Template',
      description: 'Select from 500+ device templates',
      icon: 'Smartphone'
    },
    {
      step: 4,
      title: 'Generate Mockup',
      description: 'AI creates professional mockup instantly',
      icon: 'Zap'
    }
  ];

  const codeExample = `// Mockup Gen API Example
const response = await fetch('https://api.mockupgen.com/v1/generate', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    design_url: 'https://your-design.png',
    template_id: 'iphone-15-pro',
    output_format: 'png',
    resolution: '4k'
  })
});

const mockup = await response.json();
console.log('Mockup ready:', mockup.download_url);`;

  return (
    <section id="integrations" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center px-4 py-2 bg-green-100 text-green-700 rounded-full text-sm font-medium mb-6">
            <Icon name="Puzzle" size={16} className="mr-2" />
            Seamless Integrations
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 mb-6">
            Works with Your
            <span className="text-green-600 block">Favorite Design Tools</span>
          </h2>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto">
            No need to change your workflow. Mockup Gen integrates seamlessly with 
            the tools you already use, making mockup creation effortless.
          </p>
        </div>

        {/* Integration Tabs */}
        <div className="mb-12">
          <div className="flex flex-wrap justify-center gap-4 mb-8">
            {integrations?.map((integration) => (
              <button
                key={integration?.id}
                onClick={() => setActiveIntegration(integration?.id)}
                className={`flex items-center space-x-3 px-6 py-4 rounded-xl font-medium transition-all ${
                  activeIntegration === integration?.id
                    ? 'bg-slate-900 text-white shadow-lg'
                    : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-slate-200'
                }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  activeIntegration === integration?.id ? 'bg-white/20' : integration?.color
                }`}>
                  <Icon name="Layers" size={16} className={
                    activeIntegration === integration?.id ? 'text-white' : 'text-white'
                  } />
                </div>
                <span>{integration?.name}</span>
                {integration?.stats && (
                  <span className="text-xs opacity-75">
                    {integration?.stats?.users}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Active Integration Details */}
          {integrations?.map((integration) => (
            activeIntegration === integration?.id && (
              <div key={integration?.id} className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-2xl p-8 lg:p-12">
                <div className="grid lg:grid-cols-2 gap-12 items-center">
                  {/* Left Side - Info */}
                  <div>
                    <div className="flex items-center space-x-4 mb-6">
                      <div className={`w-16 h-16 rounded-xl flex items-center justify-center ${integration?.color}`}>
                        <Icon name="Layers" size={24} className="text-white" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-slate-900">{integration?.name}</h3>
                        <p className="text-slate-600">{integration?.description}</p>
                      </div>
                    </div>

                    {/* Features */}
                    <div className="mb-8">
                      <h4 className="text-lg font-semibold text-slate-900 mb-4">Key Features</h4>
                      <div className="grid sm:grid-cols-2 gap-3">
                        {integration?.features?.map((feature, index) => (
                          <div key={index} className="flex items-center space-x-2">
                            <Icon name="Check" size={16} className="text-green-500 flex-shrink-0" />
                            <span className="text-slate-700 text-sm">{feature}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center space-x-6 mb-6">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-slate-900">{integration?.stats?.users}</div>
                        <div className="text-sm text-slate-600">Active Users</div>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center justify-center space-x-1">
                          <span className="text-2xl font-bold text-slate-900">{integration?.stats?.rating}</span>
                          <Icon name="Star" size={16} className="text-yellow-500 fill-current" />
                        </div>
                        <div className="text-sm text-slate-600">User Rating</div>
                      </div>
                    </div>

                    {/* CTA */}
                    <div className="flex space-x-4">
                      <Button
                        variant="default"
                        iconName="Download"
                        iconPosition="left"
                        className="shadow-cta"
                      >
                        {integration?.id === 'api' ? 'View Documentation' : 'Install Plugin'}
                      </Button>
                      <Button
                        variant="outline"
                        iconName="ExternalLink"
                        iconPosition="right"
                      >
                        Learn More
                      </Button>
                    </div>
                  </div>

                  {/* Right Side - Workflow or Code */}
                  <div className="bg-white rounded-xl p-6 shadow-lg border border-slate-200">
                    {integration?.id === 'api' ? (
                      <div>
                        <h4 className="text-lg font-semibold text-slate-900 mb-4">API Example</h4>
                        <div className="bg-slate-900 rounded-lg p-4 overflow-x-auto">
                          <pre className="text-sm text-green-400 font-mono">
                            <code>{codeExample}</code>
                          </pre>
                        </div>
                        <div className="mt-4 flex items-center space-x-4 text-sm text-slate-600">
                          <div className="flex items-center space-x-1">
                            <Icon name="Clock" size={14} />
                            <span>Response time: &lt;2s</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Icon name="Shield" size={14} />
                            <span>99.9% uptime</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <h4 className="text-lg font-semibold text-slate-900 mb-6">How It Works</h4>
                        <div className="space-y-4">
                          {integration?.workflow?.map((step, index) => (
                            <div key={index} className="flex items-start space-x-4">
                              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                                <span className="text-sm font-bold text-blue-600">{index + 1}</span>
                              </div>
                              <div>
                                <p className="text-slate-700 font-medium">{step}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                        
                        {/* Demo Video Placeholder */}
                        <div className="mt-6 aspect-video bg-gradient-to-br from-slate-100 to-slate-200 rounded-lg flex items-center justify-center">
                          <div className="text-center">
                            <Icon name="Play" size={32} className="mx-auto mb-2 text-slate-400" />
                            <p className="text-slate-600 text-sm">Watch {integration?.name} Integration Demo</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          ))}
        </div>

        {/* Workflow Overview */}
        <div className="mb-16">
          <div className="text-center mb-12">
            <h3 className="text-2xl font-bold text-slate-900 mb-4">Universal Workflow</h3>
            <p className="text-slate-600 max-w-2xl mx-auto">
              No matter which tool you use, the process is always simple and consistent
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {workflowSteps?.map((step, index) => (
              <div key={index} className="text-center">
                <div className="relative mb-6">
                  <div className="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <Icon name={step?.icon} size={24} className="text-blue-600" />
                  </div>
                  {index < workflowSteps?.length - 1 && (
                    <div className="hidden md:block absolute top-8 left-full w-full h-0.5 bg-slate-200 transform -translate-x-1/2">
                      <div className="absolute right-0 top-1/2 transform translate-x-1/2 -translate-y-1/2">
                        <Icon name="ArrowRight" size={16} className="text-slate-400" />
                      </div>
                    </div>
                  )}
                </div>
                <h4 className="text-lg font-semibold text-slate-900 mb-2">{step?.title}</h4>
                <p className="text-slate-600 text-sm">{step?.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Integration Benefits */}
        <div className="bg-slate-900 rounded-2xl p-8 lg:p-12 text-white">
          <div className="text-center mb-12">
            <h3 className="text-2xl font-bold mb-4">Why Integrate with Mockup Gen?</h3>
            <p className="text-slate-300 max-w-2xl mx-auto">
              Save time, maintain quality, and streamline your design workflow
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-white/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Icon name="Zap" size={24} className="text-yellow-400" />
              </div>
              <h4 className="text-lg font-semibold mb-2">Lightning Fast</h4>
              <p className="text-slate-300 text-sm">
                Generate mockups in seconds without leaving your design tool
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-white/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Icon name="Palette" size={24} className="text-blue-400" />
              </div>
              <h4 className="text-lg font-semibold mb-2">Design Fidelity</h4>
              <p className="text-slate-300 text-sm">
                Maintains your original design quality and color accuracy
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-white/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Icon name="Users" size={24} className="text-green-400" />
              </div>
              <h4 className="text-lg font-semibold mb-2">Team Collaboration</h4>
              <p className="text-slate-300 text-sm">
                Share templates and settings across your entire team
              </p>
            </div>
          </div>

          <div className="text-center mt-12">
            <Button
              variant="default"
              size="lg"
              iconName="Puzzle"
              iconPosition="left"
              className="bg-white text-slate-900 hover:bg-slate-100 shadow-cta"
            >
              Explore All Integrations
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default IntegrationSection;
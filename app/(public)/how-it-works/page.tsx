import { Container } from '@/components/layout/Container';
import { Card, CardBody } from '@/components/ui/Card';

export default function HowItWorksPage() {
  const steps = [
    {
      number: '1',
      title: 'Choose Your Product',
      description: 'Browse our extensive catalog of corporate gift items including mugs, t-shirts, pens, bags, and more.',
      icon: '🎁',
    },
    {
      number: '2',
      title: 'Upload Your Logo',
      description: 'Upload your company logo or design in any format. Our AI will automatically remove the background if needed.',
      icon: '📤',
    },
    {
      number: '3',
      title: 'Select Placement',
      description: 'Choose where you want your logo placed - horizontal, vertical, or all-over print options available.',
      icon: '🎯',
    },
    {
      number: '4',
      title: 'Generate Mockup',
      description: 'Our AI generates a professional, photorealistic mockup in under 30 seconds.',
      icon: '✨',
    },
    {
      number: '5',
      title: 'Download & Share',
      description: 'Download your mockup in high resolution. Available in PNG, JPG, or WebP formats.',
      icon: '💾',
    },
  ];

  return (
    <Container className="py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          How It Works
        </h1>
        <p className="text-lg text-gray-700 dark:text-gray-300 max-w-2xl mx-auto">
          Create professional mockups for your corporate gifts in just a few simple steps
        </p>
      </div>

      {/* Steps */}
      <div className="max-w-4xl mx-auto">
        {steps.map((step, index) => (
          <div key={step.number} className="flex gap-8 mb-12 last:mb-0">
            {/* Step Number */}
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center text-xl font-bold">
                {step.number}
              </div>
              {index < steps.length - 1 && (
                <div className="w-0.5 h-24 bg-gray-300 dark:bg-gray-600 mx-auto mt-2" />
              )}
            </div>

            {/* Step Content */}
            <Card className="flex-1">
              <CardBody>
                <div className="flex items-start gap-4">
                  <span className="text-3xl">{step.icon}</span>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                      {step.title}
                    </h3>
                    <p className="text-gray-700 dark:text-gray-300">
                      {step.description}
                    </p>
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>
        ))}
      </div>

      {/* FAQ Section */}
      <div className="mt-20">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-8 text-center">
          Frequently Asked Questions
        </h2>
        <div className="max-w-3xl mx-auto space-y-6">
          <Card>
            <CardBody>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                What file formats are supported for logo upload?
              </h3>
              <p className="text-gray-700 dark:text-gray-300">
                We support PNG, JPG, SVG, and WebP formats. For best results, use PNG with transparent background.
              </p>
            </CardBody>
          </Card>
          
          <Card>
            <CardBody>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                How long does it take to generate a mockup?
              </h3>
              <p className="text-gray-700 dark:text-gray-300">
                Most mockups are generated in under 30 seconds. Complex designs may take slightly longer.
              </p>
            </CardBody>
          </Card>
          
          <Card>
            <CardBody>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Can I edit the mockup after generation?
              </h3>
              <p className="text-gray-700 dark:text-gray-300">
                Yes! You can adjust the logo position, size, and rotation before downloading the final mockup.
              </p>
            </CardBody>
          </Card>
        </div>
      </div>
    </Container>
  );
}
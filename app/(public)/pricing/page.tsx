import { Container } from '@/components/layout/Container';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export default function PricingPage() {
  const plans = [
    {
      name: 'Free',
      price: '$0',
      features: [
        '5 mockups per month',
        'Basic quality',
        'Watermarked images',
        'Standard support',
      ],
      cta: 'Get Started',
      variant: 'outline' as const,
    },
    {
      name: 'Pro',
      price: '$29',
      features: [
        'Unlimited mockups',
        'High quality',
        'No watermarks',
        'Priority support',
        'Custom branding',
      ],
      cta: 'Start Free Trial',
      variant: 'primary' as const,
      popular: true,
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      features: [
        'Unlimited mockups',
        'Highest quality',
        'API access',
        'Dedicated support',
        'Custom integrations',
        'SLA guarantee',
      ],
      cta: 'Contact Sales',
      variant: 'outline' as const,
    },
  ];

  return (
    <Container className="py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          Simple, Transparent Pricing
        </h1>
        <p className="text-lg text-gray-700 dark:text-gray-300">
          Choose the plan that works best for your needs
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {plans.map((plan) => (
          <Card
            key={plan.name}
            variant={plan.popular ? 'bordered' : 'default'}
            className={plan.popular ? 'ring-2 ring-blue-600' : ''}
          >
            <CardHeader>
              {plan.popular && (
                <div className="text-center mb-2">
                  <span className="bg-blue-600 text-white text-sm px-3 py-1 rounded-full">
                    Most Popular
                  </span>
                </div>
              )}
              <CardTitle className="text-center">
                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {plan.name}
                </div>
                <div className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-2">
                  {plan.price}
                  {plan.price !== 'Custom' && <span className="text-lg font-normal">/month</span>}
                </div>
              </CardTitle>
            </CardHeader>
            <CardBody>
              <ul className="space-y-3 mb-6">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <svg
                      className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                  </li>
                ))}
              </ul>
              <Button variant={plan.variant} fullWidth>
                {plan.cta}
              </Button>
            </CardBody>
          </Card>
        ))}
      </div>
    </Container>
  );
}
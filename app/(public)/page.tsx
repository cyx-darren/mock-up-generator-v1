import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Container } from '@/components/layout/Container';

export default function HomePage() {
  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-blue-50 to-white py-20">
        <Container>
          <div className="text-center">
            <h1 className="text-5xl font-bold text-gray-900 mb-6">
              Create Stunning Mockups for Corporate Gifts
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Generate professional mockups with your logo on corporate gift items using AI
              technology. No design skills required.
            </p>
            <div className="flex gap-4 justify-center">
              <Link href="/catalog">
                <Button size="lg">Browse Catalog</Button>
              </Link>
              <Link href="/create">
                <Button variant="secondary" size="lg">
                  Start Creating
                </Button>
              </Link>
            </div>
          </div>
        </Container>
      </section>

      {/* How It Works */}
      <section className="py-20">
        <Container>
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-blue-600">1</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Choose a Product</h3>
              <p className="text-gray-600">Select from our catalog of corporate gift items</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-blue-600">2</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Upload Your Logo</h3>
              <p className="text-gray-600">Upload your company logo and choose placement options</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-blue-600">3</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Generate Mockup</h3>
              <p className="text-gray-600">AI generates a realistic mockup in seconds</p>
            </div>
          </div>
        </Container>
      </section>

      {/* Features */}
      <section className="py-20 bg-gray-50">
        <Container>
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Features</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-xl font-semibold mb-2">AI-Powered</h3>
              <p className="text-gray-600">
                Advanced AI technology for realistic mockup generation
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-xl font-semibold mb-2">Fast Generation</h3>
              <p className="text-gray-600">Get your mockups in under 30 seconds</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-xl font-semibold mb-2">Multiple Formats</h3>
              <p className="text-gray-600">Download in PNG, JPG, or WebP formats</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-xl font-semibold mb-2">Background Removal</h3>
              <p className="text-gray-600">Automatic logo background removal included</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-xl font-semibold mb-2">Placement Options</h3>
              <p className="text-gray-600">Choose horizontal, vertical, or all-over print</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-xl font-semibold mb-2">High Resolution</h3>
              <p className="text-gray-600">Export high-quality mockups for presentations</p>
            </div>
          </div>
        </Container>
      </section>
    </div>
  );
}

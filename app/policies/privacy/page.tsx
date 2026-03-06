export default function PrivacyPolicy() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">Privacy Policy</h1>
      
      <div className="prose prose-lg">
        <p className="text-gray-600 mb-6">Last updated: {new Date().toLocaleDateString()}</p>
        
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">1. Information We Collect</h2>
          <p>We collect:</p>
          <ul className="list-disc pl-6 mt-2">
            <li>Email address for order confirmation and report delivery</li>
            <li>Payment information (processed securely by Paddle)</li>
            <li>Website URL you submit for analysis</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">2. How We Use Your Information</h2>
          <p>Your information is used solely to:</p>
          <ul className="list-disc pl-6 mt-2">
            <li>Deliver your pricing audit report</li>
            <li>Process your payment</li>
            <li>Provide customer support</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">3. Data Security</h2>
          <p>We use industry-standard security measures to protect your data. Payment information is processed securely through Paddle and never stored on our servers.</p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">4. Third-Party Services</h2>
          <p>We use Paddle for payment processing. Paddle's privacy policy can be found at paddle.com/privacy.</p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">5. Your Rights</h2>
          <p>You have the right to request access to, correction of, or deletion of your personal data. Contact us at support@pricingaudit.com.</p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">6. Contact</h2>
          <p>For privacy questions, contact: support@pricingaudit.com</p>
        </section>
      </div>
    </div>
  );
}

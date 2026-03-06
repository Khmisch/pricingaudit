export default function TermsOfService() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">Terms of Service</h1>
      
      <div className="prose prose-lg">
        <p className="text-gray-600 mb-6">Last updated: {new Date().toLocaleDateString()}</p>
        
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">1. Service Description</h2>
          <p>PricingAudit provides automated pricing page analysis and recommendations for a one-time fee of $19.</p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">2. Payment Terms</h2>
          <p>Payment is processed securely through Paddle. All sales are final upon delivery of the analysis report.</p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">3. Refund Policy</h2>
          <p>We offer a 7-day money-back guarantee. If you're not satisfied with your pricing audit, contact us at support@pricingaudit.com within 7 days of purchase for a full refund.</p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">4. Privacy</h2>
          <p>Your privacy is important to us. We collect only the information necessary to deliver our service. See our Privacy Policy for details.</p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">5. Limitation of Liability</h2>
          <p>PricingAudit provides analysis and recommendations for informational purposes only. We are not liable for any business decisions made based on our reports.</p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">6. Contact</h2>
          <p>For questions about these Terms, contact us at: support@pricingaudit.com</p>
        </section>
      </div>
    </div>
  );
}

import React from "react";

export const metadata = {
  title: "Privacy Policy | CBC Dashboard",
  description: "Privacy Policy for CBC Dashboard application",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 to-orange-600 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold text-white mb-2">Privacy Policy</h1>
          <p className="text-orange-100">
            Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="prose prose-lg dark:prose-invert max-w-none">
          {/* Introduction */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">1. Introduction</h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              Welcome to <strong>CBC Dashboard</strong> ("we," "us," "our," or "Company"). We are committed to protecting your privacy and ensuring you have a positive experience on our platform. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our website and services.
            </p>
            <p className="text-gray-700 dark:text-gray-300">
              Please read this Privacy Policy carefully. If you do not agree with our policies and practices, please do not use our services. By accessing and using CBC Dashboard, you acknowledge that you have read, understood, and agree to be bound by all the provisions of this Privacy Policy.
            </p>
          </section>

          {/* Information We Collect */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">2. Information We Collect</h2>
            
            <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-3">2.1 Information You Provide Directly</h3>
            <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 mb-4 space-y-2">
              <li><strong>Account Information:</strong> When you create an account, we collect your name, email address, phone number, and password.</li>
              <li><strong>Profile Information:</strong> Additional information you provide in your user profile, such as job title, department, and company name.</li>
              <li><strong>Project Data:</strong> Details about projects you create or manage, including project names, descriptions, timelines, statuses, and associated files.</li>
              <li><strong>Communication Data:</strong> Messages, emails, meeting notes, and other communications you create or share through our platform.</li>
              <li><strong>Form Submissions:</strong> Any information you submit through contact forms, support requests, or feedback mechanisms.</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-3">2.2 Information Collected Automatically</h3>
            <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 mb-4 space-y-2">
              <li><strong>Device Information:</strong> Information about your device, including device type, operating system, browser type, and mobile network information.</li>
              <li><strong>Usage Data:</strong> Information about how you interact with our platform, including pages visited, links clicked, time spent on pages, and features used.</li>
              <li><strong>Log Data:</strong> Server logs containing IP addresses, access times, referring URLs, and pages accessed.</li>
              <li><strong>Cookies & Tracking Technologies:</strong> We use cookies, web beacons, and similar technologies to track activity and remember your preferences.</li>
              <li><strong>Location Data:</strong> General location information derived from IP addresses (not precise GPS location unless explicitly shared).</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-3">2.3 Information from Third-Party Services</h3>
            <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-2">
              <li><strong>Google Account Information:</strong> When you sign in using Google OAuth, we receive your email, name, profile picture, and basic account information from Google.</li>
              <li><strong>Google Workspace Integration:</strong> If you authorize access to your Google Calendar, Gmail, Google Drive, and Google Sheets, we collect and process data from these services to provide integrated functionality.</li>
              <li><strong>Third-Party Analytics:</strong> Information about your usage patterns collected by our analytics partners.</li>
            </ul>
          </section>

          {/* How We Use Your Information */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">3. How We Use Your Information</h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">We use the collected information for various purposes:</p>
            <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-2">
              <li><strong>Service Delivery:</strong> To provide, maintain, and improve our platform and services.</li>
              <li><strong>Authentication:</strong> To verify your identity and authenticate your access to your account.</li>
              <li><strong>Project Management:</strong> To process and display project data, timelines, tasks, and related information.</li>
              <li><strong>Calendar & Schedule Management:</strong> To sync and display your calendar events, meetings, and schedules.</li>
              <li><strong>Email Management:</strong> To enable email integration features and functions within our platform.</li>
              <li><strong>File Management:</strong> To store, organize, and display files associated with your projects.</li>
              <li><strong>Communication:</strong> To send you transactional emails, notifications, and service updates related to your account.</li>
              <li><strong>Analytics & Improvement:</strong> To understand user behavior, track preferences, and improve our platform's functionality and user experience.</li>
              <li><strong>Security:</strong> To detect, prevent, and address technical issues, fraud, and security concerns.</li>
              <li><strong>Legal Compliance:</strong> To comply with applicable laws, regulations, and legal processes.</li>
              <li><strong>Marketing:</strong> To send promotional materials and marketing communications (with your consent).</li>
            </ul>
          </section>

          {/* Third-Party Sharing */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">4. Sharing Your Information</h2>
            
            <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-3">4.1 Service Providers</h3>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              We may share your information with trusted service providers who assist us in operating our website, conducting our business, or serving you. These include web hosting providers, database management services, analytics providers, and payment processors. These service providers are contractually obligated to use your information only as necessary to provide services to us.
            </p>

            <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-3">4.2 Google Services</h3>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              When you authorize integration with Google services (Gmail, Google Calendar, Google Drive, Google Sheets), we receive and process your data directly from these services. All Google Workspace data is handled in accordance with Google's terms of service and our privacy commitments. You can revoke access to Google services at any time through your Google Account settings.
            </p>

            <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-3">4.3 Legal Requirements</h3>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              We may disclose your information when required by law or when we believe in good faith that such disclosure is necessary to comply with law enforcement requests, court orders, or other legal obligations.
            </p>

            <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-3">4.4 Business Transfers</h3>
            <p className="text-gray-700 dark:text-gray-300">
              If we are involved in a merger, acquisition, asset sale, bankruptcy, or other business transaction, your information may be transferred as part of that transaction. We will provide notice before your information becomes subject to a different privacy policy.
            </p>
          </section>

          {/* Data Security */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">5. Data Security</h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              We implement appropriate technical, administrative, and physical security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. These measures include:
            </p>
            <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 mb-4 space-y-2">
              <li>Encryption of data in transit and at rest using industry-standard SSL/TLS protocols.</li>
              <li>Secure authentication mechanisms including password hashing and OAuth 2.0.</li>
              <li>Regular security audits and vulnerability assessments.</li>
              <li>Access controls limiting data access to authorized personnel only.</li>
              <li>Confidentiality agreements with employees and service providers.</li>
            </ul>
            <p className="text-gray-700 dark:text-gray-300">
              However, no method of transmission over the Internet is 100% secure. While we strive to protect your personal information, we cannot guarantee absolute security. You are responsible for maintaining the confidentiality of your account credentials.
            </p>
          </section>

          {/* Data Retention */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">6. Data Retention</h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              We retain your personal information for as long as necessary to provide our services, comply with legal obligations, and resolve disputes. The retention period may vary depending on the context of processing and our legal obligations.
            </p>
            <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-2">
              <li><strong>Account Information:</strong> Retained while your account is active and for a reasonable period after account deletion for backup and legal compliance purposes.</li>
              <li><strong>Project Data:</strong> Retained as long as the project is active and for a specified retention period after project completion.</li>
              <li><strong>Log Data & Analytics:</strong> Typically retained for 90 days unless longer retention is required by law.</li>
              <li><strong>Cookies:</strong> Retain as specified in the cookie management tools (typically 1 year).</li>
            </ul>
          </section>

          {/* Cookies & Tracking */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">7. Cookies and Tracking Technologies</h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              We use cookies and similar tracking technologies to enhance your experience, remember preferences, and analyze how you use our platform.
            </p>
            <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-2">
              <li><strong>Essential Cookies:</strong> Required for core functionality, authentication, and security.</li>
              <li><strong>Preference Cookies:</strong> Remember your settings, theme preferences, and language choices.</li>
              <li><strong>Analytics Cookies:</strong> Track usage patterns to help us improve our services.</li>
              <li><strong>Marketing Cookies:</strong> Used for targeted advertising and promotional purposes.</li>
            </ul>
            <p className="text-gray-700 dark:text-gray-300 mt-4">
              You can control cookies through your browser settings. Most browsers allow you to refuse cookies or alert you when cookies are being sent. Please note that disabling certain cookies may affect platform functionality.
            </p>
          </section>

          {/* User Rights */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">8. Your Privacy Rights</h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              Depending on your jurisdiction, you may have certain rights regarding your personal information:
            </p>
            <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-2">
              <li><strong>Right to Access:</strong> You have the right to request access to the personal information we hold about you.</li>
              <li><strong>Right to Correction:</strong> You can request that we correct inaccurate or incomplete information.</li>
              <li><strong>Right to Deletion:</strong> You may request deletion of your personal information, subject to certain legal exceptions.</li>
              <li><strong>Right to Restrict Processing:</strong> You can request that we limit how we use your information.</li>
              <li><strong>Right to Data Portability:</strong> You have the right to receive your information in a portable format.</li>
              <li><strong>Right to Opt-Out:</strong> You can opt-out of marketing communications and certain data processing activities.</li>
              <li><strong>Right to Withdraw Consent:</strong> Where we process data based on your consent, you can withdraw that consent at any time.</li>
            </ul>
            <p className="text-gray-700 dark:text-gray-300 mt-4">
              To exercise any of these rights, please contact us at the email address provided below. We will respond to your request within 30 days or as required by applicable law.
            </p>
          </section>

          {/* Third-Party Links */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">9. Third-Party Links</h2>
            <p className="text-gray-700 dark:text-gray-300">
              Our platform may contain links to third-party websites and services that are not operated by us. This Privacy Policy applies only to information collected through our platform. We are not responsible for the privacy practices of third-party services. We encourage you to review the privacy policies of any third-party services before providing your information.
            </p>
          </section>

          {/* Children's Privacy */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">10. Children's Privacy</h2>
            <p className="text-gray-700 dark:text-gray-300">
              Our platform is not intended for children under the age of 13. We do not knowingly collect personal information from children under 13. If we become aware that we have collected information from a child under 13, we will take steps to delete such information and terminate the child's account. If you are aware of any personal information collected from a child under 13, please contact us immediately.
            </p>
          </section>

          {/* Changes to Privacy Policy */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">11. Changes to This Privacy Policy</h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              We reserve the right to modify this Privacy Policy at any time. Changes will be effective immediately upon posting to the platform. Your continued use of our services after posting changes constitutes your acceptance of the modified Privacy Policy.
            </p>
            <p className="text-gray-700 dark:text-gray-300">
              For significant changes, we may provide additional notice, such as a prominent notice on our platform or via email notification.
            </p>
          </section>

          {/* Contact Information */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">12. Contact Us</h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              If you have any questions, concerns, or requests regarding this Privacy Policy or our privacy practices, please contact us:
            </p>
            <div className="bg-gray-100 dark:bg-gray-800 p-6 rounded-lg">
              <p className="text-gray-900 dark:text-white mb-3">
                <strong>CBC Dashboard</strong>
              </p>
              <p className="text-gray-700 dark:text-gray-300 mb-2">
                <strong>Email:</strong> <a href="mailto:privacy@CBCdashboard.com" className="text-orange-500 hover:text-orange-600">privacy@CBCdashboard.com</a>
              </p>
              <p className="text-gray-700 dark:text-gray-300">
                We will respond to your inquiry within 30 days or as required by applicable law.
              </p>
            </div>
          </section>

          {/* Additional Information */}
          <section className="mt-12 pt-8 border-t border-gray-300 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              This Privacy Policy is effective as of the date last updated above. We encourage you to review this policy periodically for any updates or changes. Your continued use of CBC Dashboard after changes indicates your acceptance of the updated privacy practices.
            </p>
          </section>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-gray-100 dark:bg-gray-800 py-8 mt-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-gray-600 dark:text-gray-400">
            © {new Date().getFullYear()} CBC Dashboard. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}

import { useState } from 'react'
import './SupportView.css'

export default function SupportView() {
  const [openFaq, setOpenFaq] = useState(null)

  const faqs = [
    {
      q: 'How does CampusDocs verify academic documents?',
      a: 'When you upload a document, it is encrypted and mirrored into your personal Google Drive folder. Authorized faculty members and department administrators review the certificate against university records and attach an official digital verification seal.',
    },
    {
      q: 'Is my Google Drive secure?',
      a: 'Yes! CampusDocs uses Google OAuth 2.0 with the strict drive.file scope. This means CampusDocs can ONLY see and access files it creates in your dedicated "CampusDocs" folder. It can never view, alter, or access your other personal Google Drive folders.',
    },
    {
      q: 'How do I download my verified certificate?',
      a: 'You can download any verified document directly by clicking the "Download" button in the My Documents list. Verified certificates include a digital seal and QR validation code.',
    },
    {
      q: 'Who is my faculty mentor?',
      a: 'Students are assigned to an authorized faculty mentor who evaluates submitted coursework and documents. You can check your mentor details in Settings (Profile Overview) or the "My Faculty Mentor" tab.',
    },
  ]

  return (
    <div className="cd-view-panel animate-fade-in">
      <div className="cd-view-header">
        <div>
          <h2 className="cd-view-title">Help & Support</h2>
          <p className="cd-view-subtitle">Find answers to common questions about document verification, Drive syncing, and mentorship.</p>
        </div>
      </div>

      <div className="cd-support-grid">
        <div className="cd-support-card">
          <div className="cd-support-icon">📞</div>
          <h3>Department Helpdesk</h3>
          <p>Get in touch with the student documentation and verification office.</p>
          <span className="cd-support-contact">support@campusdocs.edu</span>
        </div>

        <div className="cd-support-card">
          <div className="cd-support-icon">🛡️</div>
          <h3>IT & Cloud Support</h3>
          <p>Assistance with Google Drive authentication, OAuth sync, and storage limits.</p>
          <span className="cd-support-contact">helpdesk@campusdocs.edu</span>
        </div>

        <div className="cd-support-card">
          <div className="cd-support-icon">⏰</div>
          <h3>Office Working Hours</h3>
          <p>Monday to Friday: 9:00 AM – 5:00 PM IST.<br />Saturday: 9:00 AM – 1:00 PM IST.</p>
          <span className="cd-support-contact">Campus Admin Building, Block B</span>
        </div>
      </div>

      <h3 className="cd-faq-heading">Frequently Asked Questions</h3>
      <div className="cd-faq-accordion">
        {faqs.map((faq, idx) => {
          const isOpen = openFaq === idx
          return (
            <div key={idx} className={`cd-faq-item ${isOpen ? 'open' : ''}`}>
              <button
                type="button"
                className="cd-faq-question"
                onClick={() => setOpenFaq(isOpen ? null : idx)}
              >
                <span>{faq.q}</span>
                <span className="cd-faq-icon">{isOpen ? '−' : '+'}</span>
              </button>
              {isOpen && (
                <div className="cd-faq-answer animate-fade-in">
                  <p>{faq.a}</p>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

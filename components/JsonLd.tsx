import React from 'react';

export function JsonLd() {
  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'AnxietyChat',
    url: 'https://anxiety-chat.com',
    applicationCategory: 'HealthApplication',
    description: 'AnxietyChat offers free AI-powered conversations to help you manage anxiety, stress, and overwhelming thoughts.',
    operatingSystem: 'All',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
    },
    review: {
      '@type': 'Review',
      reviewRating: {
        '@type': 'Rating',
        ratingValue: '5',
        bestRating: '5'
      },
      author: {
        '@type': 'Person',
        name: 'User'
      },
      reviewBody: 'AnxietyChat helped me manage my anxiety in moments when I needed support the most.'
    }
  };

  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'AnxietyChat',
    url: 'https://anxiety-chat.com',
    logo: 'https://anxiety-chat.com/chat-logo.png',
    description: 'Provider of AI-powered anxiety support conversations',
    sameAs: [
      'https://twitter.com/anxietychat',
    ]
  };

  const serviceSchema = {
    '@context': 'https://schema.org',
    '@type': 'HealthAndBeautyBusiness',
    name: 'AnxietyChat',
    description: 'Free AI-powered conversations to help manage anxiety and stress',
    url: 'https://anxiety-chat.com',
    serviceType: 'Mental Health Support',
    availableChannel: {
      '@type': 'ServiceChannel',
      serviceUrl: 'https://anxiety-chat.com',
      servicePhone: '',
      serviceSmsNumber: '',
      serviceLocation: {
        '@type': 'Place',
        name: 'Online'
      }
    }
  };

  return (
    <>
      <script 
        type="application/ld+json" 
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }} 
      />
      <script 
        type="application/ld+json" 
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }} 
      />
      <script 
        type="application/ld+json" 
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }} 
      />
    </>
  );
} 
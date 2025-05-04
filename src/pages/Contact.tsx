
import React, { useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Mail, MessageCircle, Linkedin, Send, Loader2, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const Contact = () => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [id]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!formData.name || !formData.email || !formData.subject || !formData.message) {
      toast({
        title: "Incomplete form",
        description: "Please fill in all fields",
        variant: "destructive"
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Save message to Supabase
      const { error } = await supabase
        .from('contact_messages')
        .insert([
          {
            name: formData.name,
            email: formData.email,
            subject: formData.subject,
            message: formData.message,
            status: 'unread'
          }
        ]);
      
      if (error) throw error;
      
      // Show success message
      setIsSuccess(true);
      toast({
        title: "Message sent",
        description: "We've received your message and will get back to you soon.",
        variant: "default"
      });
      
      // Reset form
      setFormData({
        name: '',
        email: '',
        subject: '',
        message: ''
      });
      
      // Reset success state after a delay
      setTimeout(() => {
        setIsSuccess(false);
      }, 5000);
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send your message. Please try again later.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-12">
            <h1 className="text-3xl font-bold mb-4">Contact Us</h1>
            <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Have questions, feedback, or need assistance? We're here to help.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-5xl mx-auto">
            <div>
              <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg">
                <h2 className="text-xl font-bold mb-6">Get in Touch</h2>
                
                <form onSubmit={handleSubmit}>
                  <div className="space-y-5">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium mb-1">
                        Your Name
                      </label>
                      <Input 
                        id="name" 
                        placeholder="Enter your name" 
                        value={formData.name}
                        onChange={handleInputChange}
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium mb-1">
                        Email Address
                      </label>
                      <Input 
                        id="email" 
                        type="email" 
                        placeholder="Enter your email" 
                        value={formData.email}
                        onChange={handleInputChange}
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="subject" className="block text-sm font-medium mb-1">
                        Subject
                      </label>
                      <Input 
                        id="subject" 
                        placeholder="What is this regarding?" 
                        value={formData.subject}
                        onChange={handleInputChange}
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="message" className="block text-sm font-medium mb-1">
                        Message
                      </label>
                      <Textarea 
                        id="message" 
                        placeholder="How can we help you?" 
                        rows={6}
                        value={formData.message}
                        onChange={handleInputChange}
                      />
                    </div>
                    
                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={isSubmitting || isSuccess}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Sending...
                        </>
                      ) : isSuccess ? (
                        <>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Message Sent
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4 mr-2" />
                          Send Message
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </div>
            </div>
            
            <div className="flex flex-col justify-between">
              <div>
                <h2 className="text-xl font-bold mb-6">Contact Information</h2>
                
                <div className="space-y-6">
                  <div className="flex items-start">
                    <div className="w-12 h-12 rounded-full bg-pharma-100 dark:bg-pharma-900/30 flex items-center justify-center mr-4 shrink-0">
                      <Mail className="h-6 w-6 text-pharma-600" />
                    </div>
                    <div>
                      <h3 className="font-medium mb-1">Email</h3>
                      <p className="text-gray-600 dark:text-gray-300 text-sm mb-1">
                        For general inquiries and support:
                      </p>
                      <a 
                        href="mailto:himanshusharma.shriram@gmail.com" 
                        className="text-pharma-600 hover:text-pharma-700"
                      >
                        himanshusharma.shriram@gmail.com
                      </a>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="w-12 h-12 rounded-full bg-pharma-100 dark:bg-pharma-900/30 flex items-center justify-center mr-4 shrink-0">
                      <Linkedin className="h-6 w-6 text-pharma-600" />
                    </div>
                    <div>
                      <h3 className="font-medium mb-1">LinkedIn</h3>
                      <p className="text-gray-600 dark:text-gray-300 text-sm mb-1">
                        Connect with the creator:
                      </p>
                      <a 
                        href="https://www.linkedin.com/in/himanshu-sharma" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-pharma-600 hover:text-pharma-700"
                      >
                        linkedin.com/in/himanshu-sharma
                      </a>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="w-12 h-12 rounded-full bg-pharma-100 dark:bg-pharma-900/30 flex items-center justify-center mr-4 shrink-0">
                      <MessageCircle className="h-6 w-6 text-pharma-600" />
                    </div>
                    <div>
                      <h3 className="font-medium mb-1">Response Time</h3>
                      <p className="text-gray-600 dark:text-gray-300 text-sm">
                        We typically respond to inquiries within 24-48 hours. For urgent matters, please indicate this in your message subject.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-8 p-6 bg-pharma-50 dark:bg-pharma-900/10 rounded-xl border border-pharma-100 dark:border-pharma-800/30">
                <h3 className="font-medium mb-3">About the Creator</h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">
                  PharmaLens is developed by Himanshu Sharma, a B.Pharm student at Shriram College of Pharmacy, Morena, with a passion for AI and healthcare innovation.
                </p>
                <div className="flex space-x-3">
                  <a 
                    href="mailto:himanshusharma.shriram@gmail.com" 
                    className="p-2 rounded-full bg-white dark:bg-gray-800 shadow-sm hover:shadow transition-shadow"
                    aria-label="Email"
                  >
                    <Mail className="h-5 w-5 text-pharma-600" />
                  </a>
                  <a 
                    href="https://www.linkedin.com/in/himanshu-sharma" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="p-2 rounded-full bg-white dark:bg-gray-800 shadow-sm hover:shadow transition-shadow"
                    aria-label="LinkedIn"
                  >
                    <Linkedin className="h-5 w-5 text-pharma-600" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Contact;

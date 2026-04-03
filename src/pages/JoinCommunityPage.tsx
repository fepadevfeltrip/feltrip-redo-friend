import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { FeltripLogo } from '@/components/FeltripLogo';
import { Loader2, Users, Building2 } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { LanguageSelector } from '@/components/LanguageSelector';

interface LegalDocument {
  id: string;
  type: string;
  title: string;
  content: string;
}

interface CommunityInfo {
  id: string;
  company_id: string;
  company_name: string;
  company_logo: string | null;
}

export default function JoinCommunityPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const { toast } = useToast();
  
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingLink, setIsCheckingLink] = useState(true);
  const [communityInfo, setCommunityInfo] = useState<CommunityInfo | null>(null);
  const [linkError, setLinkError] = useState<string | null>(null);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [city, setCity] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [termsDoc, setTermsDoc] = useState<LegalDocument | null>(null);
  const [privacyDoc, setPrivacyDoc] = useState<LegalDocument | null>(null);
  const [showTermsDialog, setShowTermsDialog] = useState(false);
  const [showPrivacyDialog, setShowPrivacyDialog] = useState(false);

  useEffect(() => {
    checkInviteLink();
    loadLegalDocuments();
  }, [slug]);

  const checkInviteLink = async () => {
    if (!slug) {
      setLinkError('Invalid invite link');
      setIsCheckingLink(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('community_invite_links')
        .select(`
          id,
          company_id,
          companies (
            name,
            logo_url
          )
        `)
        .eq('slug', slug)
        .eq('is_active', true)
        .maybeSingle();

      if (error || !data) {
        setLinkError('This invite link is invalid or has expired');
        setIsCheckingLink(false);
        return;
      }

      setCommunityInfo({
        id: data.id,
        company_id: data.company_id,
        company_name: (data.companies as any)?.name || 'Community',
        company_logo: (data.companies as any)?.logo_url || null
      });
    } catch (err) {
      setLinkError('Error checking invite link');
    } finally {
      setIsCheckingLink(false);
    }
  };

  const loadLegalDocuments = async () => {
    const { data } = await supabase
      .from('legal_documents')
      .select('*')
      .eq('is_active', true);
    
    if (data) {
      setTermsDoc(data.find(d => d.type === 'terms_of_use') || null);
      setPrivacyDoc(data.find(d => d.type === 'privacy_policy') || null);
    }
  };


  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!slug) return;
    
    setIsLoading(true);

    try {
      const { error } = await signIn(email, password);

      if (error) {
        toast({
          title: 'Login failed',
          description: error.message === 'Invalid login credentials' 
            ? 'Invalid email or password'
            : error.message,
          variant: 'destructive',
        });
        setIsLoading(false);
        return;
      }

      // Get current user after sign in
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      
      if (currentUser) {
        // Create or update profile first
        const { error: profileError } = await supabase.from('profiles').upsert({
          user_id: currentUser.id,
          full_name: currentUser.user_metadata?.full_name || email.split('@')[0],
          company_id: communityInfo?.company_id
        }, { onConflict: 'user_id' });

        if (profileError) {
          console.error('Profile error:', profileError);
        }

        // Join community
        const { error: joinError } = await supabase.rpc('join_community_via_link', {
          _slug: slug,
          _user_id: currentUser.id
        });

        if (joinError) {
          console.error('Join community error:', joinError);
        }

        toast({
          title: 'Welcome back!',
          description: `You have joined ${communityInfo?.company_name}`,
        });
        
        // Use navigate instead of window.location to stay within the SPA
        navigate('/', { replace: true });
      }
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!fullName.trim()) {
      toast({
        title: 'Name required',
        description: 'Please enter your full name',
        variant: 'destructive',
      });
      return;
    }

    if (!city.trim()) {
      toast({
        title: 'City required',
        description: 'Please enter your city',
        variant: 'destructive',
      });
      return;
    }

    if (!acceptedTerms) {
      toast({
        title: 'Terms required',
        description: 'Please accept the terms of use and privacy policy',
        variant: 'destructive',
      });
      return;
    }

    if (!slug) return;

    setIsLoading(true);

    try {
      // Sign up without email verification for community members
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName.trim(),
            city: city.trim()
          }
        }
      });

      if (authError) {
        toast({
          title: 'Sign up failed',
          description: authError.message,
          variant: 'destructive',
        });
        setIsLoading(false);
        return;
      }

      // Only proceed with profile creation if we have a valid session
      // (meaning email verification is disabled or user is confirmed)
      if (authData.session && authData.user) {
        const userId = authData.user.id;
        
        // Create profile with company_id from the invite link
        const { error: profileError } = await supabase.from('profiles').upsert({
          user_id: userId,
          full_name: fullName.trim(),
          city: city.trim(),
          company_id: communityInfo?.company_id
        }, { onConflict: 'user_id' });

        if (profileError) {
          console.error('Profile error:', profileError);
          toast({
            title: 'Error joining community',
            description: profileError.message,
            variant: 'destructive',
          });
          setIsLoading(false);
          return;
        }

        // Join community directly - this will set the role
        if (slug) {
          const { error: joinError } = await supabase.rpc('join_community_via_link', {
            _slug: slug,
            _user_id: userId
          });

          if (joinError) {
            console.error('Join community error:', joinError);
          }
        }

        toast({
          title: 'Welcome to the community!',
          description: `You have joined ${communityInfo?.company_name}`,
        });
        
        // Use navigate instead of window.location to stay within the SPA
        navigate('/', { replace: true });
      } else if (authData.user) {
        // Email verification is required - store data in localStorage for later
        localStorage.setItem('pendingCommunityJoin', JSON.stringify({
          slug,
          fullName: fullName.trim(),
          city: city.trim(),
          companyId: communityInfo?.company_id,
          companyName: communityInfo?.company_name
        }));
        
        toast({
          title: 'Account created!',
          description: 'Please check your email to verify your account, then sign in.',
        });
        setIsLoading(false);
      } else {
        toast({
          title: 'Error',
          description: 'Could not complete registration. Please try again.',
          variant: 'destructive',
        });
        setIsLoading(false);
      }
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message,
        variant: 'destructive',
      });
      setIsLoading(false);
    }
  };

  if (isCheckingLink) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-primary/5 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (linkError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-primary/5 flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="flex justify-center mb-4">
              <FeltripLogo />
            </div>
            <CardTitle className="text-destructive">Invalid Link</CardTitle>
            <CardDescription>{linkError}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/auth')} className="w-full">
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-primary/5 flex items-center justify-center p-4 relative">
      <div className="absolute top-4 right-4">
        <LanguageSelector />
      </div>
      
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-3">
          <div className="flex justify-center">
            <FeltripLogo />
          </div>
          
          {/* Community Info */}
          <div className="flex items-center justify-center gap-3 p-3 bg-primary/5 rounded-lg">
            {communityInfo?.company_logo ? (
              <img 
                src={communityInfo.company_logo} 
                alt={communityInfo.company_name}
                className="h-12 w-12 rounded-lg object-cover"
              />
            ) : (
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Building2 className="h-6 w-6 text-primary" />
              </div>
            )}
            <div className="text-left">
              <p className="text-sm text-muted-foreground">You're invited to join</p>
              <p className="font-semibold text-lg">{communityInfo?.company_name}</p>
            </div>
          </div>

          <CardTitle className="text-xl font-bold text-primary">Join Community</CardTitle>
          <CardDescription>
            Create an account or sign in to join this community
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <Tabs defaultValue="signup" className="space-y-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
              <TabsTrigger value="signin">Sign In</TabsTrigger>
            </TabsList>

            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name">Full Name</Label>
                  <Input
                    id="signup-name"
                    type="text"
                    placeholder="Your full name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-city">City</Label>
                  <Input
                    id="signup-city"
                    type="text"
                    placeholder="Your city"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isLoading}
                    minLength={6}
                  />
                </div>

                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="terms"
                    checked={acceptedTerms}
                    onCheckedChange={(checked) => setAcceptedTerms(checked === true)}
                    disabled={isLoading}
                  />
                  <Label htmlFor="terms" className="text-sm leading-relaxed cursor-pointer">
                    I accept the{' '}
                    <button
                      type="button"
                      onClick={() => setShowTermsDialog(true)}
                      className="text-primary hover:underline font-medium"
                    >
                      Terms of Use
                    </button>
                    {' '}and{' '}
                    <button
                      type="button"
                      onClick={() => setShowPrivacyDialog(true)}
                      className="text-primary hover:underline font-medium"
                    >
                      Privacy Policy
                    </button>
                  </Label>
                </div>

                <Button type="submit" className="w-full" disabled={isLoading || !acceptedTerms}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating account...
                    </>
                  ) : (
                    <>
                      <Users className="mr-2 h-4 w-4" />
                      Join Community
                    </>
                  )}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-email">Email</Label>
                  <Input
                    id="signin-email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signin-password">Password</Label>
                  <Input
                    id="signin-password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isLoading}
                    minLength={6}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    <>
                      <Users className="mr-2 h-4 w-4" />
                      Sign In & Join
                    </>
                  )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Terms Dialog */}
      <Dialog open={showTermsDialog} onOpenChange={setShowTermsDialog}>
        <DialogContent className="max-w-lg max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>{termsDoc?.title || 'Terms of Use'}</DialogTitle>
            <DialogDescription>
              Please read the terms of use carefully.
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[50vh] pr-4">
            <div className="text-sm text-muted-foreground whitespace-pre-wrap">
              {termsDoc?.content || 'Loading...'}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Privacy Dialog */}
      <Dialog open={showPrivacyDialog} onOpenChange={setShowPrivacyDialog}>
        <DialogContent className="max-w-lg max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>{privacyDoc?.title || 'Privacy Policy'}</DialogTitle>
            <DialogDescription>
              Please read the privacy policy carefully.
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[50vh] pr-4">
            <div className="text-sm text-muted-foreground whitespace-pre-wrap">
              {privacyDoc?.content || 'Loading...'}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
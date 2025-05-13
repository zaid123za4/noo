
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, ArrowRight } from 'lucide-react';
import dhanService from '@/services/dhanService';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/components/ui/use-toast';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

const formSchema = z.object({
  apiKey: z.string().min(1, { message: "API Key is required" }),
  apiSecret: z.string().min(1, { message: "API Secret is required" }),
});

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      apiKey: "",
      apiSecret: "",
    },
  });
  
  const handleLogin = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    try {
      // Set the user's API credentials
      dhanService.setCredentials(values.apiKey, values.apiSecret);
      
      // Attempt to login with provided credentials
      const loginUrl = await dhanService.login();
      
      // For demo purposes, we'll simulate a successful callback
      // In production, this would redirect to the Dhan login page 
      // and then handle the callback with a request token
      const success = await dhanService.handleCallback('mock_request_token');
      
      if (success) {
        toast({
          title: "Login successful",
          description: "You have been authenticated with Dhan",
        });
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Login failed:', error);
      toast({
        variant: "destructive",
        title: "Login failed",
        description: "Could not authenticate with Dhan. Please check your credentials.",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md border-border/50 bg-card/95 backdrop-blur">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold tracking-tight">
            Dhan Auto Trader
          </CardTitle>
          <CardDescription>
            Log in with your Dhan API credentials to continue
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="flex items-center space-x-2 rounded-md border p-4">
            <AlertCircle className="h-5 w-5 text-trade-neutral" />
            <div className="flex-1 space-y-1">
              <p className="text-sm font-medium leading-none">Connect Your Account</p>
              <p className="text-xs text-muted-foreground">
                Enter your Dhan API credentials to access your account and start trading.
              </p>
            </div>
          </div>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleLogin)} className="space-y-4">
              <FormField
                control={form.control}
                name="apiKey"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>API Key</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter your Dhan API key" {...field} />
                    </FormControl>
                    <FormDescription>
                      Found in your Dhan account dashboard
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="apiSecret"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>API Secret</FormLabel>
                    <FormControl>
                      <Input 
                        type="password" 
                        placeholder="Enter your Dhan API secret" 
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      Keep this secret and secure
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Button 
                type="submit" 
                className="w-full font-semibold" 
                disabled={isLoading}
              >
                {isLoading ? "Connecting..." : "Connect to Dhan"}
                {!isLoading && <ArrowRight className="ml-2 h-4 w-4" />}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginPage;

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Brain, Heart, GraduationCap, MessageCircle, Clock, CheckCircle, PlayCircle, Star, Loader2, Users } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";

interface ServiceRequest {
  id: string;
  service_type: string;
  expatriate_name: string; // Now stores company name
  status: 'solicitado' | 'em_andamento' | 'concluido';
  rating: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

const WHATSAPP_NUMBER = "5521976100692"; // Feltrip WhatsApp number

const SERVICES = [
  { 
    id: 'culture_tutor', 
    label: 'Culture Tutor', 
    icon: Brain, 
    color: 'hsl(var(--chart-1))',
    description: 'Cultural guidance and adaptation support for your team members',
    bgColor: 'bg-blue-50 dark:bg-blue-950/20',
    iconColor: 'text-blue-600 dark:text-blue-400',
  },
];

const STATUS_CONFIG = {
  solicitado: { label: 'Requested', icon: Clock, color: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20' },
  em_andamento: { label: 'In Progress', icon: PlayCircle, color: 'bg-blue-500/10 text-blue-600 border-blue-500/20' },
  concluido: { label: 'Completed', icon: CheckCircle, color: 'bg-green-500/10 text-green-600 border-green-500/20' },
};

export function InternalRequestsPanel() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingRequest, setEditingRequest] = useState<string | null>(null);
  const [editNotes, setEditNotes] = useState('');
  const [editRating, setEditRating] = useState<number | null>(null);
  
  // Request creation state
  const [selectedService, setSelectedService] = useState<typeof SERVICES[0] | null>(null);
  const [companyName, setCompanyName] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('internal_service_requests' as any)
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRequests((data as unknown as ServiceRequest[]) || []);
    } catch (error) {
      console.error('Error fetching requests:', error);
      toast.error('Failed to load requests');
    } finally {
      setIsLoading(false);
    }
  };

  const createRequest = async () => {
    if (!user || !selectedService || !companyName.trim()) {
      toast.error('Please enter the company name');
      return;
    }

    setIsCreating(true);
    try {
      const { data, error } = await supabase
        .from('internal_service_requests' as any)
        .insert({
          user_id: user.id,
          service_type: selectedService.id,
          expatriate_name: companyName.trim(), // Storing company name
          status: 'solicitado',
        })
        .select()
        .single();

      if (error) throw error;

      // Add to local state
      setRequests(prev => [(data as unknown as ServiceRequest), ...prev]);
      
      // Open WhatsApp
      const message = encodeURIComponent(
        `Hello! I would like to request the ${selectedService.label} service for company: ${companyName.trim()}`
      );
      window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${message}`, '_blank');

      toast.success('Request created successfully!');
      setIsDialogOpen(false);
      setCompanyName('');
      setSelectedService(null);
    } catch (error) {
      console.error('Error creating request:', error);
      toast.error('Failed to create request');
    } finally {
      setIsCreating(false);
    }
  };

  const openRequestDialog = (service: typeof SERVICES[0]) => {
    setSelectedService(service);
    setCompanyName('');
    setIsDialogOpen(true);
  };

  const updateRequestStatus = async (requestId: string, newStatus: 'solicitado' | 'em_andamento' | 'concluido') => {
    try {
      const { error } = await supabase
        .from('internal_service_requests' as any)
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', requestId);

      if (error) throw error;
      
      setRequests(prev => prev.map(r => 
        r.id === requestId ? { ...r, status: newStatus } : r
      ));
      toast.success('Status updated!');
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    }
  };

  const saveRequestEvaluation = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('internal_service_requests' as any)
        .update({ 
          rating: editRating, 
          notes: editNotes,
          updated_at: new Date().toISOString() 
        })
        .eq('id', requestId);

      if (error) throw error;
      
      setRequests(prev => prev.map(r => 
        r.id === requestId ? { ...r, rating: editRating, notes: editNotes } : r
      ));
      setEditingRequest(null);
      setEditNotes('');
      setEditRating(null);
      toast.success('Evaluation saved!');
    } catch (error) {
      console.error('Error saving evaluation:', error);
      toast.error('Failed to save evaluation');
    }
  };

  // Calculate statistics
  const stats = {
    total: requests.length,
    solicitado: requests.filter(r => r.status === 'solicitado').length,
    em_andamento: requests.filter(r => r.status === 'em_andamento').length,
    concluido: requests.filter(r => r.status === 'concluido').length,
  };

  const completionRate = stats.total > 0 
    ? Math.round((stats.concluido / stats.total) * 100) 
    : 0;

  const avgRating = requests.filter(r => r.rating).length > 0
    ? (requests.filter(r => r.rating).reduce((sum, r) => sum + (r.rating || 0), 0) / requests.filter(r => r.rating).length).toFixed(1)
    : 'N/A';

  // Chart data based on real requests - filter out zero values
  const statusChartData = [
    { name: 'Requested', value: stats.solicitado, color: 'hsl(45, 93%, 47%)' },
    { name: 'In Progress', value: stats.em_andamento, color: 'hsl(217, 91%, 60%)' },
    { name: 'Completed', value: stats.concluido, color: 'hsl(142, 76%, 36%)' },
  ].filter(item => item.value > 0);

  const serviceTypeData = SERVICES.map(service => ({
    name: service.label,
    requests: requests.filter(r => r.service_type === service.id).length,
    completed: requests.filter(r => r.service_type === service.id && r.status === 'concluido').length,
  }));

  const getServiceIcon = (serviceType: string) => {
    const service = SERVICES.find(s => s.id === serviceType);
    return service?.icon || MessageCircle;
  };

  const getServiceLabel = (serviceType: string) => {
    const service = SERVICES.find(s => s.id === serviceType);
    return service?.label || serviceType;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Request Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedService && (
                <>
                  <selectedService.icon className="h-5 w-5 text-primary" />
                  Request {selectedService.label}
                </>
              )}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <label className="text-sm font-medium">Company Name</label>
              <Input
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Enter company name"
                className="mt-1"
              />
            </div>
            <Button 
              onClick={createRequest} 
              className="w-full gap-2"
              disabled={isCreating || !companyName.trim()}
            >
              {isCreating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <MessageCircle className="h-4 w-4" />
              )}
              Create Request & Open WhatsApp
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Feltrip Local Services - Request Bar */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Feltrip Local Services
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Request specialized support services for your team via WhatsApp
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
            {SERVICES.map((service) => {
              const Icon = service.icon;
              return (
                <Card key={service.id} className="p-3 md:p-4">
                  <div className="flex items-start gap-3">
                    <div className={`p-2 md:p-3 rounded-xl ${service.bgColor} shrink-0`}>
                      <Icon className={`h-5 w-5 md:h-6 md:w-6 ${service.iconColor}`} />
                    </div>
                    <div className="flex-1 space-y-2 min-w-0">
                      <h4 className="font-semibold text-foreground text-sm md:text-base">{service.label}</h4>
                      <p className="text-xs text-muted-foreground line-clamp-2">{service.description}</p>
                      <Button
                        size="sm"
                        onClick={() => openRequestDialog(service)}
                        className="w-full gap-2"
                      >
                        <MessageCircle className="h-4 w-4" />
                        Request
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Statistics Cards */}
      <div className="grid gap-3 grid-cols-2 md:gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2 p-3 md:p-6 md:pb-2">
            <CardTitle className="text-xs md:text-sm font-medium">Total Requests</CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0 md:p-6 md:pt-0">
            <div className="text-xl md:text-2xl font-bold text-primary">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 p-3 md:p-6 md:pb-2">
            <CardTitle className="text-xs md:text-sm font-medium">Completion</CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0 md:p-6 md:pt-0">
            <div className="text-xl md:text-2xl font-bold text-green-600">{completionRate}%</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 p-3 md:p-6 md:pb-2">
            <CardTitle className="text-xs md:text-sm font-medium">Avg Rating</CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0 md:p-6 md:pt-0">
            <div className="text-xl md:text-2xl font-bold text-chart-2 flex items-center gap-1">
              {avgRating} <Star className="h-4 w-4 md:h-5 md:w-5 fill-current" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 p-3 md:p-6 md:pb-2">
            <CardTitle className="text-xs md:text-sm font-medium">In Progress</CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0 md:p-6 md:pt-0">
            <div className="text-xl md:text-2xl font-bold text-blue-600">{stats.em_andamento}</div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      {stats.total > 0 && (
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Status Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={statusChartData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {statusChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Requests by Service Type</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={serviceTypeData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" stroke="hsl(var(--foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--foreground))" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Legend />
                  <Bar dataKey="requests" fill="hsl(var(--primary))" name="Total" />
                  <Bar dataKey="completed" fill="hsl(var(--chart-2))" name="Completed" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Requests List */}
      <Card>
        <CardHeader>
          <CardTitle>Service Requests</CardTitle>
        </CardHeader>
        <CardContent>
          {requests.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No requests yet</p>
              <p className="text-sm">Click "Request" above to create a new service request</p>
            </div>
          ) : (
            <div className="space-y-4">
              {requests.map((request) => {
                const ServiceIcon = getServiceIcon(request.service_type);
                const statusConfig = STATUS_CONFIG[request.status];
                const StatusIcon = statusConfig.icon;

                return (
                  <Card key={request.id} className="p-4">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                          <ServiceIcon className="h-5 w-5 text-primary" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="font-semibold text-foreground truncate">{getServiceLabel(request.service_type)}</h4>
                          <p className="text-sm text-muted-foreground truncate">{request.expatriate_name}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(request.created_at).toLocaleDateString('en-US')}
                          </p>
                          {request.rating && (
                            <div className="flex items-center gap-1 mt-2">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={`h-4 w-4 ${star <= request.rating! ? 'fill-yellow-400 text-yellow-400' : 'text-muted'}`}
                                />
                              ))}
                            </div>
                          )}
                          {request.notes && (
                            <p className="text-sm text-muted-foreground mt-2 italic line-clamp-2">"{request.notes}"</p>
                          )}
                        </div>
                      </div>
                      <div className="flex sm:flex-col items-center sm:items-end gap-2 justify-between sm:justify-start">
                        <Badge className={`${statusConfig.color} text-xs shrink-0`}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          <span className="truncate">{statusConfig.label}</span>
                        </Badge>
                        <Select
                          value={request.status}
                          onValueChange={(value) => updateRequestStatus(request.id, value as any)}
                        >
                          <SelectTrigger className="w-[120px] sm:w-[140px] h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="solicitado">Requested</SelectItem>
                            <SelectItem value="em_andamento">In Progress</SelectItem>
                            <SelectItem value="concluido">Completed</SelectItem>
                          </SelectContent>
                        </Select>
                        {request.status === 'concluido' && !request.rating && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditingRequest(request.id);
                              setEditNotes(request.notes || '');
                              setEditRating(request.rating);
                            }}
                          >
                            Rate
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Evaluation Form */}
                    {editingRequest === request.id && (
                      <div className="mt-4 pt-4 border-t space-y-3">
                        <div>
                          <label className="text-sm font-medium">Rating</label>
                          <div className="flex gap-1 mt-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                onClick={() => setEditRating(star)}
                                className="p-1"
                              >
                                <Star
                                  className={`h-6 w-6 ${star <= (editRating || 0) ? 'fill-yellow-400 text-yellow-400' : 'text-muted hover:text-yellow-400'}`}
                                />
                              </button>
                            ))}
                          </div>
                        </div>
                        <div>
                          <label className="text-sm font-medium">Notes</label>
                          <Textarea
                            value={editNotes}
                            onChange={(e) => setEditNotes(e.target.value)}
                            placeholder="Add notes about the service..."
                            className="mt-1"
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => saveRequestEvaluation(request.id)}>
                            Save
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => setEditingRequest(null)}>
                            Cancel
                          </Button>
                        </div>
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Shield, AlertTriangle, Heart, MapPin, Users, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import MapboxMap from "@/components/maps/MapboxMap";

interface SecureMapProps {
  onBack: () => void;
}

interface LocationReport {
  id: string;
  userName: string;
  address: string;
  description: string;
  feelingType: 'safe' | 'alert' | 'danger';
  createdAt: string;
  latitude?: number;
  longitude?: number;
}

const SecureMap = ({ onBack }: SecureMapProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [locationReports, setLocationReports] = useState<LocationReport[]>([]);
  const [stats, setStats] = useState({ safe: 0, alert: 0, danger: 0, total: 0 });

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      
      try {
        // Fetch profiles first
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, full_name');

        const profileMap = new Map(profiles?.map(p => [p.user_id, p.full_name]) || []);

        // Fetch map_pins which have coordinates - only those shared with HR
        const { data: mapPins } = await supabase
          .from('map_pins')
          .select('*')
          .eq('is_shared_with_hr', true)
          .in('type', ['safe', 'alert', 'danger'])
          .order('created_at', { ascending: false });

        // Process location reports from map_pins
        const reports: LocationReport[] = [];
        let safeCount = 0, alertCount = 0, dangerCount = 0;

        (mapPins || []).forEach(pin => {
          const feelingType = pin.type as 'safe' | 'alert' | 'danger';
          
          reports.push({
            id: pin.id,
            userName: profileMap.get(pin.user_id) || 'Collaborator',
            address: pin.title,
            description: pin.content || '',
            feelingType,
            createdAt: pin.created_at,
            latitude: pin.latitude,
            longitude: pin.longitude
          });

          if (feelingType === 'safe') safeCount++;
          else if (feelingType === 'alert') alertCount++;
          else if (feelingType === 'danger') dangerCount++;
        });

        setLocationReports(reports);
        setStats({ 
          safe: safeCount, 
          alert: alertCount, 
          danger: dangerCount,
          total: safeCount + alertCount + dangerCount
        });
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const getFeelingBadge = (type: string) => {
    switch (type) {
      case "safe": return <Badge className="bg-chart-2/10 text-chart-2 border-chart-2/20">Welcoming</Badge>;
      case "alert": return <Badge className="bg-secondary/10 text-secondary border-secondary/20">Caution</Badge>;
      case "danger": return <Badge className="bg-destructive/10 text-destructive border-destructive/20">Danger</Badge>;
      default: return null;
    }
  };

  const getFeelingColor = (type: string) => {
    switch (type) {
      case "safe": return "bg-chart-2";
      case "alert": return "bg-secondary";
      case "danger": return "bg-destructive";
      default: return "bg-muted";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-accent/10 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={onBack}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
                <Shield className="h-8 w-8 text-primary" />
                Safety Map - HR View
              </h1>
              <p className="text-muted-foreground">Locations shared by collaborators with HR</p>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* Stats Cards */}
            <div className="grid gap-6 md:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Locations</CardTitle>
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-primary">{stats.total}</div>
                  <p className="text-xs text-muted-foreground">Reported</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Welcoming Places</CardTitle>
                  <Heart className="h-4 w-4 text-chart-2" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-chart-2">{stats.safe}</div>
                  <p className="text-xs text-muted-foreground">Safe</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Caution Areas</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-secondary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-secondary">{stats.alert}</div>
                  <p className="text-xs text-muted-foreground">Require care</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Danger Zones</CardTitle>
                  <Shield className="h-4 w-4 text-destructive" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-destructive">{stats.danger}</div>
                  <p className="text-xs text-muted-foreground">Avoid</p>
                </CardContent>
              </Card>
            </div>

            {/* Real Mapbox Map */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" />
                  Safety Map
                </CardTitle>
              </CardHeader>
              <CardContent>
                <MapboxMap 
                  pins={locationReports
                    .filter(r => r.latitude && r.longitude)
                    .map(r => ({
                      id: r.id,
                      latitude: r.latitude!,
                      longitude: r.longitude!,
                      type: r.feelingType,
                      title: r.address,
                      content: `${r.userName}: ${r.description || 'No description'}`
                    }))}
                  className="h-[400px]"
                  showUserLocation={false}
                />
                {locationReports.filter(r => r.latitude && r.longitude).length === 0 && (
                  <p className="text-center text-muted-foreground text-sm mt-4">
                    Locations will be displayed on the map when they have geographic coordinates.
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Location Reports List */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  Locations Reported by Collaborators
                </CardTitle>
              </CardHeader>
              <CardContent>
                {locationReports.length > 0 ? (
                  <div className="space-y-4">
                    {locationReports.map((report) => (
                      <div
                        key={report.id}
                        className="flex items-start justify-between p-4 rounded-lg border border-border bg-card hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-start gap-4">
                          <div className={`w-12 h-12 rounded-full ${getFeelingColor(report.feelingType)} flex items-center justify-center`}>
                            {report.feelingType === 'safe' && <Heart className="h-6 w-6 text-white" />}
                            {report.feelingType === 'alert' && <AlertTriangle className="h-6 w-6 text-white" />}
                            {report.feelingType === 'danger' && <Shield className="h-6 w-6 text-white" />}
                          </div>
                          <div>
                            <h3 className="font-semibold text-foreground">{report.address}</h3>
                            <p className="text-sm text-muted-foreground">Reported by: {report.userName}</p>
                            {report.description && (
                              <p className="text-sm text-muted-foreground mt-1">{report.description}</p>
                            )}
                            <p className="text-xs text-muted-foreground mt-1">
                              {new Date(report.createdAt).toLocaleDateString('en-US')}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getFeelingBadge(report.feelingType)}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No locations have been reported yet.</p>
                    <p className="text-sm">Collaborators can report locations through the app.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
};

export default SecureMap;

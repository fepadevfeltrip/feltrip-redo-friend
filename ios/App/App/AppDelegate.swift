import UIKit
import Capacitor
import Firebase
import FirebaseMessaging
import UserNotifications

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {

    var window: UIWindow?

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        
        // 1. Configura o Firebase
        FirebaseApp.configure()
        
        // 2. Define o Delegate das notificações (para aparecer em foreground)
        UNUserNotificationCenter.current().delegate = self
        
        return true
    }

    // Chamado quando o registro no APNs (Apple) funciona
    func application(_ application: UIApplication, didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data) {
        // Vincula o token da Apple ao Firebase (Essencial!)
        Messaging.messaging().apnsToken = deviceToken
        
        // Avisa o Capacitor que o registro nativo funcionou
        NotificationCenter.default.post(name: .capacitorDidRegisterForRemoteNotifications, object: deviceToken)
    }

    // Chamado se o registro no APNs falhar
    func application(_ application: UIApplication, didFailToRegisterForRemoteNotificationsWithError error: Error) {
        print("❌ Falha ao registrar no APNs: \(error)")
        NotificationCenter.default.post(name: .capacitorDidFailToRegisterForRemoteNotifications, object: error)
    }

    // MARK: - Funções Essenciais do Capacitor (Devem ficar dentro da classe)
    func application(_ app: UIApplication, open url: URL, options: [UIApplication.OpenURLOptionsKey : Any] = [:]) -> Bool {
        return ApplicationDelegateProxy.shared.application(app, open: url, options: options)
    }

    func application(_ application: UIApplication, continue userActivity: NSUserActivity, restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void) -> Bool {
        return ApplicationDelegateProxy.shared.application(application, continue: userActivity, restorationHandler: restorationHandler)
    }
}

// MARK: - UNUserNotificationCenterDelegate
// Responsável por mostrar a notificação quando o app está aberto
extension AppDelegate: UNUserNotificationCenterDelegate {
    
    func userNotificationCenter(_ center: UNUserNotificationCenter,
                                willPresent notification: UNNotification,
                                withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void) {
        
        // Define que a notificação deve aparecer como banner, som e badge mesmo com app aberto
        completionHandler([.banner, .sound, .badge])
    }

    func userNotificationCenter(_ center: UNUserNotificationCenter,
                                didReceive response: UNNotificationResponse,
                                withCompletionHandler completionHandler: @escaping () -> Void) {
        
        // Aqui você trata o clique na notificação se necessário
        let userInfo = response.notification.request.content.userInfo
        print("📩 Notificação clicada: \(userInfo)")
        
        completionHandler()
    }
}

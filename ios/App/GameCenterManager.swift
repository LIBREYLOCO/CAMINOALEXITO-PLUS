import Foundation
import GameKit
import UIKit

final class GameCenterManager: NSObject, ObservableObject {
    static let shared = GameCenterManager()
    @Published private(set) var isAuthenticated = GKLocalPlayer.local.isAuthenticated

    func authenticate(presenting presenterProvider: @autoclosure () -> UIViewController?) {
        GKLocalPlayer.local.authenticateHandler = { vc, error in
            if let vc, let presenter = presenterProvider() {
                presenter.present(vc, animated: true)
                return
            }
            if let error {
                print("Game Center auth error: \(error)")
            }
            self.isAuthenticated = GKLocalPlayer.local.isAuthenticated
        }
    }
}

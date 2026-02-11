import Foundation
import GameKit
import UIKit

final class GameCenterManager: NSObject, ObservableObject {
    static let shared = GameCenterManager()
    @Published private(set) var isAuthenticated = GKLocalPlayer.local.isAuthenticated

    func authenticate(presenting presenter: UIViewController?) {
        GKLocalPlayer.local.authenticateHandler = { vc, error in
            if let vc, let presenter {
                presenter.present(vc, animated: true)
                return
            }
            if let error {
                print("Game Center auth error: \(error)")
            }
            self.isAuthenticated = GKLocalPlayer.local.isAuthenticated
        }
    }

    // MARK: - Leaderboards
    func report(score: Int, to leaderboardID: String, completion: ((Error?) -> Void)? = nil) {
        guard GKLocalPlayer.local.isAuthenticated else {
            completion?(NSError(domain: "GameCenter", code: -1, userInfo: [NSLocalizedDescriptionKey: "Player not authenticated"]))
            return
        }
        GKLeaderboard.submitScore(score, context: 0, player: GKLocalPlayer.local, leaderboardIDs: [leaderboardID]) { error in
            if let error { print("[GC] Submit score error: \(error)") }
            completion?(error)
        }
    }

    // MARK: - Achievements
    func reportAchievement(identifier: String, percentComplete: Double = 100.0, showsCompletionBanner: Bool = true, completion: ((Error?) -> Void)? = nil) {
        guard GKLocalPlayer.local.isAuthenticated else {
            completion?(NSError(domain: "GameCenter", code: -1, userInfo: [NSLocalizedDescriptionKey: "Player not authenticated"]))
            return
        }
        let achievement = GKAchievement(identifier: identifier)
        achievement.percentComplete = percentComplete
        achievement.showsCompletionBanner = showsCompletionBanner
        GKAchievement.report([achievement]) { error in
            if let error { print("[GC] Report achievement error: \(error)") }
            completion?(error)
        }
    }

    func resetAchievements(completion: ((Error?) -> Void)? = nil) {
        GKAchievement.resetAchievements { error in
            if let error { print("[GC] Reset achievements error: \(error)") }
            completion?(error)
        }
    }

    // MARK: - Access Point & Dashboard
    func setAccessPoint(visible: Bool, location: GKAccessPoint.Location = .topLeading) {
        let ap = GKAccessPoint.shared
        ap.location = location
        ap.isActive = visible
    }

    func presentDashboard(from presenter: UIViewController) {
        let gcVC = GKGameCenterViewController()
        gcVC.gameCenterDelegate = self
        presenter.present(gcVC, animated: true)
    }
}
extension GameCenterManager: GKGameCenterControllerDelegate {
    func gameCenterViewControllerDidFinish(_ gameCenterViewController: GKGameCenterViewController) {
        gameCenterViewController.dismiss(animated: true)
    }
}


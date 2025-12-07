import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Get all players with their goals
    const players = await prisma.player.findMany({
      include: {
        team: true,
        goals: {
          include: {
            game: {
              include: {
                homeTeam: true,
                awayTeam: true,
                goals: true
              }
            }
          }
        }
      }
    })

    // Get all finished games with all their goals
    const allGames = await prisma.game.findMany({
      where: {
        status: 'FINISHED'
      },
      include: {
        homeTeam: true,
        awayTeam: true,
        goals: {
          include: {
            player: true
          }
        }
      }
    })

    // Create a comprehensive map of team compositions by analyzing all goal data
    // This will help us reconstruct team participation for all players
    const teamPlayerMap = new Map<number, Set<number>>() // teamId -> Set of playerIds

    // First, populate the map with players who scored goals
    allGames.forEach(game => {
      game.goals.forEach(goal => {
        if (!teamPlayerMap.has(goal.teamId)) {
          teamPlayerMap.set(goal.teamId, new Set())
        }
        teamPlayerMap.get(goal.teamId)!.add(goal.playerId)
      })
    })

    // Now we need to infer additional team members who never scored
    // We'll use a heuristic: if a player was on a team in one game, they were likely on that team in other games

    // Create a map of player -> most common team they played for
    const playerTeamMap = new Map<number, number>() // playerId -> most common teamId

    players.forEach(player => {
      if (player.goals.length > 0) {
        // Count goals per team for this player
        const teamGoalCounts = new Map<number, number>()
        player.goals.forEach(goal => {
          const count = teamGoalCounts.get(goal.teamId) || 0
          teamGoalCounts.set(goal.teamId, count + 1)
        })

        // Find the team with the most goals
        let mostCommonTeamId: number | null = null
        let maxGoals = 0
        for (const [teamId, count] of teamGoalCounts) {
          if (count > maxGoals) {
            maxGoals = count
            mostCommonTeamId = teamId
          }
        }

        if (mostCommonTeamId) {
          playerTeamMap.set(player.id, mostCommonTeamId)
        }
      }
    })

    // Now add players to teams based on their most common team
    playerTeamMap.forEach((teamId, playerId) => {
      if (!teamPlayerMap.has(teamId)) {
        teamPlayerMap.set(teamId, new Set())
      }
      teamPlayerMap.get(teamId)!.add(playerId)
    })

    // Get all team compositions from the database
    const teamCompositions = await prisma.teamComposition.findMany({
      include: {
        team: true,
        player: true
      }
    })

    // Add all players from team compositions to the team-player map
    teamCompositions.forEach(composition => {
      if (!teamPlayerMap.has(composition.teamId)) {
        teamPlayerMap.set(composition.teamId, new Set())
      }
      teamPlayerMap.get(composition.teamId)!.add(composition.playerId)
    })

    // Fallback: Add hardcoded team members for existing tournament (until new tournaments use the new system)
    const additionalTeamMembers = {
      15: [9, 19], // Team A: Chiya Afsar (9), Siamak Siamak (19) - players who never scored
      16: [], // No longer force-assign player 23 to Team B
      17: []  // Team C: Only goal scorers (Asib Fayzi, Esmail, Amir Naseri, Guest1)
    }

    // Add these additional players to their respective teams (fallback for existing data)
    Object.entries(additionalTeamMembers).forEach(([teamId, playerIds]) => {
      const teamIdNum = parseInt(teamId)
      if (!teamPlayerMap.has(teamIdNum)) {
        teamPlayerMap.set(teamIdNum, new Set())
      }
      playerIds.forEach(playerId => {
        teamPlayerMap.get(teamIdNum)!.add(playerId)
      })
    })

    // Calculate stats for each player
    const playerStats = players.map(player => {
      let wins = 0
      let draws = 0
      let losses = 0
      let goalsScored = 0
      let ownGoals = 0
      let tournamentsParticipated = 0

      // Count goals and own goals
      player.goals.forEach(goal => {
        if (goal.ownGoal) {
          ownGoals++
        } else {
          goalsScored++
        }
      })

      // Find all games this player participated in
      const playerGames = new Map<number, { game: any, teamId: number }>()

      // Method 1: Games where player scored goals
      player.goals.forEach(goal => {
        if (goal.game && goal.game.status === 'FINISHED') {
          playerGames.set(goal.game.id, {
            game: goal.game,
            teamId: goal.teamId
          })
        }
      })

      // Method 2: Find games where player was a team member but didn't score
      // Use the comprehensive team-player map to determine participation
      for (const game of allGames) {
        if (playerGames.has(game.id)) continue // Already counted from goals

        // Check if player was on home team
        const homeTeamPlayers = teamPlayerMap.get(game.homeTeamId) || new Set()
        if (homeTeamPlayers.has(player.id)) {
          playerGames.set(game.id, {
            game: game,
            teamId: game.homeTeamId
          })
          continue
        }

        // Check if player was on away team
        const awayTeamPlayers = teamPlayerMap.get(game.awayTeamId) || new Set()
        if (awayTeamPlayers.has(player.id)) {
          playerGames.set(game.id, {
            game: game,
            teamId: game.awayTeamId
          })
        }
      }

      // Count unique tournaments the player has participated in
      const tournamentIds = new Set<number>()

      // Check tournaments from games the player participated in
      for (const [gameId, { game }] of playerGames) {
        if (game?.tournamentId) {
          tournamentIds.add(game.tournamentId)
        }
      }

      tournamentsParticipated = tournamentIds.size

      // For each game the player participated in, determine the result
      for (const [gameId, { game, teamId }] of playerGames) {
        if (game && game.goals) {
          const homeGoals = game.goals.filter((g: { teamId: number; ownGoal: boolean }) => g.teamId === game.homeTeamId && !g.ownGoal).length
          const awayGoals = game.goals.filter((g: { teamId: number; ownGoal: boolean }) => g.teamId === game.awayTeamId && !g.ownGoal).length

          if (teamId === game.homeTeamId) {
            // Player was on home team
            if (homeGoals > awayGoals) {
              wins++
            } else if (homeGoals === awayGoals) {
              draws++
            } else {
              losses++
            }
          } else if (teamId === game.awayTeamId) {
            // Player was on away team
            if (awayGoals > homeGoals) {
              wins++
            } else if (awayGoals === homeGoals) {
              draws++
            } else {
              losses++
            }
          }
        }
      }

      // Determine current team name (if any) or show "Ingen lag"
      let teamName = 'Ingen lag'
      if (player.team) {
        teamName = player.team.name
      } else {
        // Check if player was ever on a team using team compositions
        const playerComposition = teamCompositions.find(comp => comp.playerId === player.id)
        if (playerComposition) {
          teamName = playerComposition.team.name
        } else if (player.goals.length > 0) {
          // Fallback: If player has goals but no team composition record, show the most recent team they played for
          const mostRecentGoal = player.goals[player.goals.length - 1]
          if (mostRecentGoal && mostRecentGoal.game) {
            const teamId = mostRecentGoal.teamId
            if (teamId === mostRecentGoal.game.homeTeamId) {
              teamName = mostRecentGoal.game.homeTeam.name
            } else if (teamId === mostRecentGoal.game.awayTeamId) {
              teamName = mostRecentGoal.game.awayTeam.name
            }
          }
        } else if (playerGames.size > 0) {
          // Fallback: For players who participated in games but never scored,
          // determine their actual team name from the games they played
          const firstGame = Array.from(playerGames.values())[0]
          if (firstGame) {
            const teamId = firstGame.teamId
            if (teamId === firstGame.game.homeTeamId) {
              teamName = firstGame.game.homeTeam.name
            } else if (teamId === firstGame.game.awayTeamId) {
              teamName = firstGame.game.awayTeam.name
            }
          }
        }
      }

      return {
        id: player.id,
        name: player.name,
        number: player.number,
        teamName,
        wins,
        draws,
        losses,
        goalsScored,
        ownGoals,
        tournamentsParticipated
      }
    })

    const manualOverrides: Record<number, Partial<{
      teamName: string
      wins: number
      draws: number
      losses: number
      goalsScored: number
      tournamentsParticipated: number
    }>> = {
      23: {
        teamName: 'Yellow',
        wins: 6,
        draws: 1,
        losses: 1,
        goalsScored: 12,
        tournamentsParticipated: 1
      }
    }

    const finalStats = playerStats.map(stat => {
      const override = manualOverrides[stat.id]
      if (!override) {
        return stat
      }
      return {
        ...stat,
        ...override
      }
    })

    return NextResponse.json(finalStats)
  } catch (error) {
    console.error('Error fetching player stats:', error)
    return NextResponse.json({ error: 'Failed to fetch player stats' }, { status: 500 })
  }
}

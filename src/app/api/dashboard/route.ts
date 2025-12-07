
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        // 1. Get Latest Tournament (Ongoing or Last Finished)
        // We prioritize the most recently updated tournament to ensure we show the relevant one
        const lastTournament = await prisma.tournament.findFirst({
            orderBy: { updatedAt: 'desc' },
            include: {
                games: {
                    include: {
                        goals: true
                    }
                },
                teams: true
            }
        });

        // Calculate standings for this tournament
        let standings: any[] = [];
        if (lastTournament) {
            standings = lastTournament.teams.map(team => {
                const teamGames = lastTournament.games.filter(g => g.status === 'FINISHED' && (g.homeTeamId === team.id || g.awayTeamId === team.id));
                let wins = 0;
                let losses = 0;
                let draws = 0;
                let goalsFor = 0;
                let goalsAgainst = 0;

                teamGames.forEach(game => {
                    const isHome = game.homeTeamId === team.id;
                    const selfScore = isHome ? game.homeScore : game.awayScore;
                    const oppScore = isHome ? game.awayScore : game.homeScore;

                    goalsFor += selfScore;
                    goalsAgainst += oppScore;

                    if (selfScore > oppScore) wins++;
                    else if (selfScore < oppScore) losses++;
                    else draws++;
                });

                return {
                    id: team.id,
                    name: team.name,
                    played: teamGames.length,
                    wins,
                    draws,
                    losses,
                    points: (wins * 3) + draws,
                    goalDiff: goalsFor - goalsAgainst
                };
            }).sort((a, b) => {
                if (b.points !== a.points) return b.points - a.points;
                if (b.goalDiff !== a.goalDiff) return b.goalDiff - a.goalDiff;
                return 0; // simplified tie-breaker
            });
        }

        // 2. Get Next Matches (IN_PROGRESS first, then SCHEDULED)
        // First check for active games
        const inProgressGames = await prisma.game.findMany({
            where: { status: 'IN_PROGRESS' },
            include: { homeTeam: true, awayTeam: true },
            take: 3
        });

        // Get scheduled games to fill up to 3 total
        const scheduledGames = await prisma.game.findMany({
            where: { status: 'SCHEDULED' },
            orderBy: { createdAt: 'asc' },
            include: { homeTeam: true, awayTeam: true },
            take: 3 - inProgressGames.length
        });

        // Combine: in-progress first, then scheduled
        const upcomingMatches = [...inProgressGames, ...scheduledGames].slice(0, 3);

        // 3. Top Scorers for the SPECIFIC Tournament
        // Manually count goals excluding own goals for accurate results
        let topScorers: any[] = [];
        if (lastTournament) {
            // Get all goals from this tournament that are NOT own goals
            const goals = await prisma.goal.findMany({
                where: {
                    ownGoal: false,
                    game: { tournamentId: lastTournament.id }
                },
                include: {
                    player: {
                        include: { team: true }
                    },
                    team: true  // Also include the goal's team relation
                }
            });

            // Count goals per player
            const playerGoalCounts = new Map<number, { player: any; teamName: string; count: number }>();

            for (const goal of goals) {
                const playerId = goal.playerId;
                // Get team name from goal.team or player.team
                const teamName = goal.team?.name || goal.player?.team?.name || 'Unknown';

                if (!playerGoalCounts.has(playerId)) {
                    playerGoalCounts.set(playerId, {
                        player: goal.player,
                        teamName: teamName,
                        count: 0
                    });
                }
                playerGoalCounts.get(playerId)!.count++;
            }

            // Convert to array, sort by count, take top 10
            topScorers = Array.from(playerGoalCounts.values())
                .map(({ player, teamName, count }) => ({
                    id: player.id,
                    name: player.name,
                    teamName: teamName,
                    goals: count
                }))
                .filter(p => p.goals > 0)
                .sort((a, b) => b.goals - a.goals)
                .slice(0, 10);
        }

        return NextResponse.json({
            lastTournament: lastTournament ? {
                name: lastTournament.name,
                standings
            } : null,
            upcomingMatches: upcomingMatches.map(m => ({
                id: m.id,
                homeTeam: m.homeTeam.name,
                awayTeam: m.awayTeam.name,
                homeScore: m.homeScore,
                awayScore: m.awayScore,
                status: m.status
            })),
            topScorers,
            tournamentName: lastTournament?.name || null,
            tournamentDate: lastTournament?.createdAt || null
        });

    } catch (error) {
        console.error('Error fetching dashboard data:', error);
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}

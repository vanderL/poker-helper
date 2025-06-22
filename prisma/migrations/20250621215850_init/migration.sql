-- CreateTable
CREATE TABLE "players" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "nickname" TEXT,
    "initial_notes" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "players_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "game_sessions" (
    "id" SERIAL NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "location" TEXT,
    "player_count" INTEGER NOT NULL,
    "duration_minutes" INTEGER,
    "my_result" DECIMAL(65,30) NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "game_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session_players" (
    "id" SERIAL NOT NULL,
    "session_id" INTEGER NOT NULL,
    "player_id" INTEGER NOT NULL,
    "position" TEXT,
    "final_result" DECIMAL(65,30) NOT NULL,
    "mood" TEXT,
    "notes" TEXT,

    CONSTRAINT "session_players_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hand_actions" (
    "id" SERIAL NOT NULL,
    "session_id" INTEGER NOT NULL,
    "player_id" INTEGER NOT NULL,
    "hand_number" INTEGER NOT NULL,
    "street" TEXT NOT NULL,
    "position" TEXT,
    "action_type" TEXT NOT NULL,
    "pot_size" DECIMAL(65,30),
    "bet_size" DECIMAL(65,30),
    "my_hand" TEXT,
    "board" TEXT,
    "result" TEXT,
    "showed_cards" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hand_actions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "player_patterns" (
    "id" SERIAL NOT NULL,
    "player_id" INTEGER NOT NULL,
    "pattern_type" TEXT NOT NULL,
    "pattern_value" DECIMAL(65,30) NOT NULL,
    "confidence_score" INTEGER NOT NULL,
    "sample_size" INTEGER NOT NULL,
    "last_updated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "player_patterns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bankroll_tracking" (
    "id" SERIAL NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "starting_bankroll" DECIMAL(65,30) NOT NULL,
    "buy_in" DECIMAL(65,30) NOT NULL DEFAULT 5.00,
    "rebuy_amount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "prize_won" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "ending_bankroll" DECIMAL(65,30) NOT NULL,
    "session_id" INTEGER,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bankroll_tracking_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "players_name_key" ON "players"("name");

-- AddForeignKey
ALTER TABLE "session_players" ADD CONSTRAINT "session_players_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "game_sessions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session_players" ADD CONSTRAINT "session_players_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "players"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hand_actions" ADD CONSTRAINT "hand_actions_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "game_sessions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hand_actions" ADD CONSTRAINT "hand_actions_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "players"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "player_patterns" ADD CONSTRAINT "player_patterns_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "players"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

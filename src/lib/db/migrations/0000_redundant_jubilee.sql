CREATE EXTENSION IF NOT EXISTS postgis;--> statement-breakpoint
CREATE TYPE "public"."anchor_type" AS ENUM('airport_code', 'city_region', 'map_area');--> statement-breakpoint
CREATE TYPE "public"."assigned_to_type" AS ENUM('user', 'automation', 'concierge');--> statement-breakpoint
CREATE TYPE "public"."bet_participant_status" AS ENUM('pending', 'accepted', 'declined');--> statement-breakpoint
CREATE TYPE "public"."bet_status" AS ENUM('proposed', 'accepted', 'declined', 'resolved', 'voided', 'expired');--> statement-breakpoint
CREATE TYPE "public"."booking_mode" AS ENUM('direct', 'guided_checkout', 'assisted');--> statement-breakpoint
CREATE TYPE "public"."booking_request_status" AS ENUM('candidate', 'window_pending', 'requested', 'partial_hold', 'booked', 'swappable', 'locked', 'played', 'canceled');--> statement-breakpoint
CREATE TYPE "public"."booking_slot_status" AS ENUM('pending', 'attempting', 'held', 'confirmed', 'failed', 'released');--> statement-breakpoint
CREATE TYPE "public"."booking_source" AS ENUM('direct_api', 'guided_checkout', 'assisted', 'external');--> statement-breakpoint
CREATE TYPE "public"."consent_state" AS ENUM('pending', 'approved', 'vetoed');--> statement-breakpoint
CREATE TYPE "public"."course_access_confidence" AS ENUM('verified', 'unverified', 'disputed');--> statement-breakpoint
CREATE TYPE "public"."course_access_type" AS ENUM('public', 'resort', 'semi_private', 'private', 'unknown');--> statement-breakpoint
CREATE TYPE "public"."course_status" AS ENUM('draft', 'active', 'hidden', 'archived');--> statement-breakpoint
CREATE TYPE "public"."expense_category" AS ENUM('tee_time', 'lodging', 'meal', 'transport', 'other');--> statement-breakpoint
CREATE TYPE "public"."external_booking_type" AS ENUM('golf', 'lodging', 'flight', 'other');--> statement-breakpoint
CREATE TYPE "public"."fee_calculation_method" AS ENUM('flat', 'percentage');--> statement-breakpoint
CREATE TYPE "public"."fee_charge_status" AS ENUM('pending', 'collectible', 'charged', 'refunded', 'waived');--> statement-breakpoint
CREATE TYPE "public"."fee_type" AS ENUM('tee_time_service', 'bet_fee', 'lodging_service', 'air_service', 'cancellation_penalty', 'pass_through');--> statement-breakpoint
CREATE TYPE "public"."game_format" AS ENUM('stroke_play', 'best_ball', 'skins', 'nassau', 'custom');--> statement-breakpoint
CREATE TYPE "public"."game_status" AS ENUM('created', 'in_play', 'completed');--> statement-breakpoint
CREATE TYPE "public"."invite_method" AS ENUM('email', 'share_link', 'sms');--> statement-breakpoint
CREATE TYPE "public"."invite_status" AS ENUM('pending', 'accepted', 'declined');--> statement-breakpoint
CREATE TYPE "public"."itinerary_item_source" AS ENUM('platform', 'external', 'manual');--> statement-breakpoint
CREATE TYPE "public"."itinerary_item_status" AS ENUM('confirmed', 'pending', 'canceled', 'completed');--> statement-breakpoint
CREATE TYPE "public"."itinerary_item_type" AS ENUM('golf', 'lodging', 'flight', 'dining', 'transport', 'note', 'other');--> statement-breakpoint
CREATE TYPE "public"."microsite_publish_state" AS ENUM('draft', 'published', 'unpublished');--> statement-breakpoint
CREATE TYPE "public"."microsite_visibility" AS ENUM('unlisted', 'public');--> statement-breakpoint
CREATE TYPE "public"."notification_channel" AS ENUM('email', 'in_app', 'sms');--> statement-breakpoint
CREATE TYPE "public"."publish_state" AS ENUM('private', 'review_pending', 'publish_eligible', 'published', 'withdrawn');--> statement-breakpoint
CREATE TYPE "public"."report_status" AS ENUM('open', 'reviewed', 'resolved', 'dismissed');--> statement-breakpoint
CREATE TYPE "public"."report_type" AS ENUM('misclassified_access', 'wrong_price', 'closed_permanently', 'duplicate', 'other');--> statement-breakpoint
CREATE TYPE "public"."reservation_status" AS ENUM('confirmed', 'swappable', 'locked', 'played', 'canceled', 'no_show');--> statement-breakpoint
CREATE TYPE "public"."round_status" AS ENUM('scheduled', 'in_progress', 'completed', 'finalized', 'canceled');--> statement-breakpoint
CREATE TYPE "public"."settlement_status" AS ENUM('pending', 'confirmed');--> statement-breakpoint
CREATE TYPE "public"."split_method" AS ENUM('equal', 'custom', 'exclude');--> statement-breakpoint
CREATE TYPE "public"."swap_approval_state" AS ENUM('suggested', 'approved', 'declined', 'auto_approved', 'expired');--> statement-breakpoint
CREATE TYPE "public"."swap_policy" AS ENUM('notify_only', 'captain_approval', 'auto_upgrade');--> statement-breakpoint
CREATE TYPE "public"."system_role" AS ENUM('user', 'admin', 'concierge_ops');--> statement-breakpoint
CREATE TYPE "public"."travel_source" AS ENUM('affiliate', 'partner', 'manual');--> statement-breakpoint
CREATE TYPE "public"."trip_option_status" AS ENUM('proposed', 'shortlisted', 'voting', 'finalized', 'eliminated');--> statement-breakpoint
CREATE TYPE "public"."trip_option_type" AS ENUM('destination', 'course', 'itinerary');--> statement-breakpoint
CREATE TYPE "public"."trip_role" AS ENUM('collaborator', 'captain');--> statement-breakpoint
CREATE TYPE "public"."trip_status" AS ENUM('draft', 'planning', 'voting', 'booking', 'locked', 'in_progress', 'completed', 'archived');--> statement-breakpoint
CREATE TYPE "public"."user_status" AS ENUM('active', 'suspended', 'deactivated');--> statement-breakpoint
CREATE TYPE "public"."verified_status" AS ENUM('unverified', 'pending_verification', 'verified', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."vote_value" AS ENUM('in', 'fine', 'out');--> statement-breakpoint
CREATE TYPE "public"."voting_mode" AS ENUM('destination', 'course');--> statement-breakpoint
CREATE TABLE "activity_feed_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"trip_id" uuid NOT NULL,
	"event_type" varchar(100) NOT NULL,
	"actor_id" uuid,
	"description" text NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "airports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"iata_code" varchar(10) NOT NULL,
	"name" varchar(255) NOT NULL,
	"city" varchar(255),
	"state" varchar(2),
	"location" geography(Point, 4326) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "airports_iata_code_unique" UNIQUE("iata_code")
);
--> statement-breakpoint
CREATE TABLE "bet_participants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"bet_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"side" varchar(100),
	"status" "bet_participant_status" DEFAULT 'pending' NOT NULL,
	"status_changed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_bet_participants_bet_user" UNIQUE("bet_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "bets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"trip_id" uuid NOT NULL,
	"round_id" uuid,
	"creator_id" uuid NOT NULL,
	"name" varchar(255),
	"amount" numeric(10, 2) DEFAULT '0' NOT NULL,
	"trigger_description" text NOT NULL,
	"status" "bet_status" DEFAULT 'proposed' NOT NULL,
	"status_changed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"outcome" text,
	"resolved_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "booking_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"trip_id" uuid NOT NULL,
	"course_id" uuid NOT NULL,
	"target_date" date NOT NULL,
	"target_time_range" jsonb NOT NULL,
	"preferred_time" varchar(10),
	"num_golfers" integer NOT NULL,
	"party_split" jsonb,
	"mode" "booking_mode" NOT NULL,
	"status" "booking_request_status" DEFAULT 'candidate' NOT NULL,
	"booking_window_opens_at" timestamp with time zone,
	"created_by" uuid NOT NULL,
	"assigned_to" uuid,
	"assigned_to_type" "assigned_to_type",
	"notes" text,
	"status_changed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "booking_slots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"booking_request_id" uuid NOT NULL,
	"group_num" integer NOT NULL,
	"player_ids" jsonb,
	"target_time" varchar(10),
	"status" "booking_slot_status" DEFAULT 'pending' NOT NULL,
	"assigned_to_type" "assigned_to_type",
	"assigned_to_id" uuid,
	"hold_expires_at" timestamp with time zone,
	"confirmation_number" varchar(255),
	"confirmed_tee_time" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "course_composites" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"course_id" uuid NOT NULL,
	"editorial_score" numeric(5, 2),
	"external_rank_score" numeric(5, 2),
	"value_score" numeric(5, 2),
	"community_average_score" numeric(5, 2),
	"review_count" integer DEFAULT 0 NOT NULL,
	"trip_fit_inputs" jsonb,
	"value_label" varchar(100),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "course_composites_course_id_unique" UNIQUE("course_id")
);
--> statement-breakpoint
CREATE TABLE "course_reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"course_id" uuid NOT NULL,
	"reporter_id" uuid NOT NULL,
	"report_type" "report_type" NOT NULL,
	"description" text NOT NULL,
	"report_status" "report_status" DEFAULT 'open' NOT NULL,
	"reviewed_by" uuid,
	"resolved_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "course_reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"course_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"round_id" uuid,
	"conditioning" integer NOT NULL,
	"layout" integer NOT NULL,
	"value" integer NOT NULL,
	"pace" integer NOT NULL,
	"service" integer NOT NULL,
	"vibe" integer NOT NULL,
	"overall_score" numeric(3, 1) NOT NULL,
	"text" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_course_review_per_user" UNIQUE("course_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "course_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"course_id" uuid NOT NULL,
	"booking_window_rule" text,
	"booking_window_days" integer,
	"cancellation_rule" text,
	"cancellation_deadline_hours" integer,
	"max_players" integer,
	"public_times_available" boolean,
	"booking_channel" varchar(50),
	"cancellation_penalty_amount" numeric(10, 2),
	"rules_confirmed" boolean DEFAULT false NOT NULL,
	"notes" text,
	"source" varchar(50),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "course_rules_course_id_unique" UNIQUE("course_id")
);
--> statement-breakpoint
CREATE TABLE "courses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"city" varchar(255),
	"state" varchar(2),
	"location" geography(Point, 4326) NOT NULL,
	"access_type" "course_access_type" DEFAULT 'public' NOT NULL,
	"access_confidence" "course_access_confidence" DEFAULT 'unverified' NOT NULL,
	"price_band_min" numeric(10, 2),
	"price_band_max" numeric(10, 2),
	"reasons_to_play" text,
	"website_url" varchar(500),
	"phone" varchar(20),
	"amenities" jsonb,
	"photos" jsonb,
	"status" "course_status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "external_bookings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"trip_id" uuid NOT NULL,
	"type" "external_booking_type" NOT NULL,
	"source" varchar(255),
	"confirmation_number" varchar(255),
	"date" date NOT NULL,
	"time" varchar(10),
	"cost" numeric(10, 2),
	"booking_contact" varchar(255),
	"notes" text,
	"link_url" varchar(500),
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fee_charges" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"trip_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"fee_type" "fee_type" NOT NULL,
	"source_object_type" varchar(50) NOT NULL,
	"source_object_id" uuid NOT NULL,
	"fee_schedule_id" uuid,
	"amount" numeric(10, 2) NOT NULL,
	"refund_amount" numeric(10, 2),
	"status" "fee_charge_status" DEFAULT 'pending' NOT NULL,
	"payment_reference" varchar(255),
	"disclosed_at" timestamp with time zone,
	"charged_at" timestamp with time zone,
	"refunded_at" timestamp with time zone,
	"status_changed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fee_schedules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"fee_type" "fee_type" NOT NULL,
	"calculation_method" "fee_calculation_method" NOT NULL,
	"flat_amount" numeric(10, 2),
	"percentage_rate" numeric(5, 4),
	"per_golfer_cap" numeric(10, 2),
	"effective_from" timestamp with time zone NOT NULL,
	"effective_to" timestamp with time zone,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "flight_options" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"trip_id" uuid NOT NULL,
	"source" "travel_source" DEFAULT 'affiliate' NOT NULL,
	"airline" varchar(100),
	"departure_airport" varchar(10) NOT NULL,
	"arrival_airport" varchar(10) NOT NULL,
	"departure_time" timestamp with time zone NOT NULL,
	"arrival_time" timestamp with time zone NOT NULL,
	"price" numeric(10, 2),
	"passengers" integer DEFAULT 1 NOT NULL,
	"link_url" varchar(500),
	"saved_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "game_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"format" "game_format" NOT NULL,
	"rules_description" text,
	"automated" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "games" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"round_id" uuid NOT NULL,
	"template_id" uuid,
	"name" varchar(255) NOT NULL,
	"teams" jsonb NOT NULL,
	"stakes_per_player" numeric(10, 2),
	"results" jsonb,
	"status" "game_status" DEFAULT 'created' NOT NULL,
	"status_changed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "itinerary_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"trip_id" uuid NOT NULL,
	"item_type" "itinerary_item_type" NOT NULL,
	"title" varchar(500) NOT NULL,
	"date" date NOT NULL,
	"start_time" timestamp with time zone,
	"end_time" timestamp with time zone,
	"location" jsonb,
	"confirmation_number" varchar(255),
	"booking_contact" varchar(255),
	"participants" jsonb,
	"contact_notes" text,
	"cost" numeric(10, 2),
	"notes" text,
	"status" "itinerary_item_status" DEFAULT 'confirmed' NOT NULL,
	"source" "itinerary_item_source" DEFAULT 'manual' NOT NULL,
	"related_reservation_id" uuid,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lodging_options" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"trip_id" uuid NOT NULL,
	"source" "travel_source" DEFAULT 'affiliate' NOT NULL,
	"name" varchar(255) NOT NULL,
	"location" jsonb,
	"check_in" date NOT NULL,
	"check_out" date NOT NULL,
	"guests" integer NOT NULL,
	"price_per_night" numeric(10, 2),
	"total_price" numeric(10, 2),
	"bedrooms" integer,
	"link_url" varchar(500) NOT NULL,
	"thumbnail_url" varchar(500),
	"saved_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "membership_entitlements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"club_name" varchar(255) NOT NULL,
	"network_name" varchar(255),
	"access_type" varchar(50) NOT NULL,
	"verified_status" "verified_status" DEFAULT 'unverified' NOT NULL,
	"willing_to_sponsor" boolean DEFAULT false NOT NULL,
	"guest_limit_notes" text,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "microsites" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"trip_id" uuid NOT NULL,
	"slug" varchar(100) NOT NULL,
	"selected_asset_ids" jsonb NOT NULL,
	"content" jsonb,
	"publish_state" "microsite_publish_state" DEFAULT 'draft' NOT NULL,
	"status_changed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"visibility_mode" "microsite_visibility" DEFAULT 'unlisted' NOT NULL,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "microsites_trip_id_unique" UNIQUE("trip_id"),
	CONSTRAINT "microsites_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "notification_preferences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"event_type" varchar(100) NOT NULL,
	"channel" "notification_channel" NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_notification_pref" UNIQUE("user_id","event_type","channel")
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"trip_id" uuid,
	"event_type" varchar(100) NOT NULL,
	"title" varchar(500) NOT NULL,
	"body" text NOT NULL,
	"link_url" varchar(500),
	"read_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "photo_assets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"trip_id" uuid NOT NULL,
	"uploader_id" uuid NOT NULL,
	"storage_key" varchar(500) NOT NULL,
	"thumbnail_key" varchar(500),
	"caption" text,
	"metadata" jsonb,
	"publish_state" "publish_state" DEFAULT 'private' NOT NULL,
	"status_changed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "photo_consents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"photo_asset_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"consent_state" "consent_state" DEFAULT 'pending' NOT NULL,
	"status_changed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"decided_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_photo_consents_photo_user" UNIQUE("photo_asset_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "photo_tags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"photo_asset_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"tagged_by_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_photo_tags_photo_user" UNIQUE("photo_asset_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "reservation_swaps" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"trip_id" uuid NOT NULL,
	"old_reservation_id" uuid NOT NULL,
	"new_reservation_id" uuid,
	"recommendation_reason" text NOT NULL,
	"approval_state" "swap_approval_state" DEFAULT 'suggested' NOT NULL,
	"cost_delta_per_golfer" numeric(10, 2),
	"quality_delta" numeric(5, 2),
	"drive_time_delta" integer,
	"cancellation_penalty" numeric(10, 2),
	"suggested_at" timestamp with time zone DEFAULT now() NOT NULL,
	"decided_at" timestamp with time zone,
	"decided_by" uuid,
	"decline_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reservations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"booking_request_id" uuid NOT NULL,
	"booking_slot_id" uuid,
	"trip_id" uuid NOT NULL,
	"course_id" uuid NOT NULL,
	"confirmation_number" varchar(255),
	"tee_time" timestamp with time zone NOT NULL,
	"player_ids" jsonb NOT NULL,
	"cost_per_player" numeric(10, 2),
	"total_cost" numeric(10, 2),
	"booking_source" "booking_source" NOT NULL,
	"status" "reservation_status" DEFAULT 'confirmed' NOT NULL,
	"cancellation_deadline" timestamp with time zone,
	"cancellation_penalty_amount" numeric(10, 2),
	"fee_state" varchar(20),
	"status_changed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rounds" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"trip_id" uuid NOT NULL,
	"course_id" uuid NOT NULL,
	"round_date" date NOT NULL,
	"format" varchar(50),
	"status" "round_status" DEFAULT 'scheduled' NOT NULL,
	"status_changed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"finalized_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "score_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"round_id" uuid NOT NULL,
	"player_id" uuid NOT NULL,
	"hole_number" integer NOT NULL,
	"strokes" integer NOT NULL,
	"net_strokes" integer,
	"client_timestamp" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_score_entries_round_player_hole" UNIQUE("round_id","player_id","hole_number")
);
--> statement-breakpoint
CREATE TABLE "settlement_actions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"trip_id" uuid NOT NULL,
	"from_user_id" uuid NOT NULL,
	"to_user_id" uuid NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"method" varchar(50),
	"deep_link_url" varchar(500),
	"status" "settlement_status" DEFAULT 'pending' NOT NULL,
	"status_changed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"confirmed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "trip_expenses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"trip_id" uuid NOT NULL,
	"payer_id" uuid NOT NULL,
	"description" varchar(500) NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"category" "expense_category" NOT NULL,
	"split_method" "split_method" DEFAULT 'equal' NOT NULL,
	"custom_splits" jsonb,
	"excluded_user_ids" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "trip_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"trip_id" uuid NOT NULL,
	"user_id" uuid,
	"role" "trip_role" DEFAULT 'collaborator' NOT NULL,
	"response_status" "invite_status" DEFAULT 'pending' NOT NULL,
	"invite_email" varchar(255),
	"invite_method" "invite_method",
	"invite_token" varchar(64),
	"invited_by" uuid NOT NULL,
	"hard_constraints" jsonb,
	"soft_preferences" jsonb,
	"invited_at" timestamp with time zone DEFAULT now() NOT NULL,
	"responded_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "trip_members_invite_token_unique" UNIQUE("invite_token"),
	CONSTRAINT "uq_trip_member" UNIQUE("trip_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "trip_options" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"trip_id" uuid NOT NULL,
	"course_id" uuid,
	"type" "trip_option_type" NOT NULL,
	"title" varchar(500) NOT NULL,
	"estimated_cost_per_golfer" numeric(10, 2),
	"fit_score" numeric(5, 2),
	"fit_rationale" text,
	"status" "trip_option_status" DEFAULT 'proposed' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "trip_series" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "trips" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"date_start" date NOT NULL,
	"date_end" date NOT NULL,
	"golfer_count" integer DEFAULT 4 NOT NULL,
	"anchor_type" "anchor_type" NOT NULL,
	"anchor_value" varchar(255) NOT NULL,
	"anchor_lat" numeric(10, 7),
	"anchor_lng" numeric(10, 7),
	"budget_settings" jsonb,
	"status" "trip_status" DEFAULT 'draft' NOT NULL,
	"creator_id" uuid NOT NULL,
	"series_id" uuid,
	"status_changed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"freeze_date" date,
	"swap_policy" "swap_policy" DEFAULT 'captain_approval' NOT NULL,
	"voting_deadline" timestamp with time zone,
	"voting_mode" "voting_mode" DEFAULT 'destination' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"email_verified" timestamp with time zone,
	"phone" varchar(20),
	"handicap" numeric(3, 1),
	"home_airport" varchar(10),
	"preferred_location" varchar(255),
	"password_hash" varchar(255) NOT NULL,
	"status" "user_status" DEFAULT 'active' NOT NULL,
	"system_role" "system_role" DEFAULT 'user' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "votes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"trip_option_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"vote_value" "vote_value" NOT NULL,
	"comment" text,
	"budget_objection" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_vote_per_option" UNIQUE("trip_option_id","user_id")
);
--> statement-breakpoint
ALTER TABLE "activity_feed_entries" ADD CONSTRAINT "activity_feed_entries_trip_id_trips_id_fk" FOREIGN KEY ("trip_id") REFERENCES "public"."trips"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_feed_entries" ADD CONSTRAINT "activity_feed_entries_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bet_participants" ADD CONSTRAINT "bet_participants_bet_id_bets_id_fk" FOREIGN KEY ("bet_id") REFERENCES "public"."bets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bet_participants" ADD CONSTRAINT "bet_participants_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bets" ADD CONSTRAINT "bets_trip_id_trips_id_fk" FOREIGN KEY ("trip_id") REFERENCES "public"."trips"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bets" ADD CONSTRAINT "bets_round_id_rounds_id_fk" FOREIGN KEY ("round_id") REFERENCES "public"."rounds"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bets" ADD CONSTRAINT "bets_creator_id_users_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking_requests" ADD CONSTRAINT "booking_requests_trip_id_trips_id_fk" FOREIGN KEY ("trip_id") REFERENCES "public"."trips"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking_requests" ADD CONSTRAINT "booking_requests_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking_requests" ADD CONSTRAINT "booking_requests_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking_requests" ADD CONSTRAINT "booking_requests_assigned_to_users_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking_slots" ADD CONSTRAINT "booking_slots_booking_request_id_booking_requests_id_fk" FOREIGN KEY ("booking_request_id") REFERENCES "public"."booking_requests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_composites" ADD CONSTRAINT "course_composites_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_reports" ADD CONSTRAINT "course_reports_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_reports" ADD CONSTRAINT "course_reports_reporter_id_users_id_fk" FOREIGN KEY ("reporter_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_reports" ADD CONSTRAINT "course_reports_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_reviews" ADD CONSTRAINT "course_reviews_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_reviews" ADD CONSTRAINT "course_reviews_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_rules" ADD CONSTRAINT "course_rules_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "external_bookings" ADD CONSTRAINT "external_bookings_trip_id_trips_id_fk" FOREIGN KEY ("trip_id") REFERENCES "public"."trips"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "external_bookings" ADD CONSTRAINT "external_bookings_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fee_charges" ADD CONSTRAINT "fee_charges_trip_id_trips_id_fk" FOREIGN KEY ("trip_id") REFERENCES "public"."trips"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fee_charges" ADD CONSTRAINT "fee_charges_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fee_charges" ADD CONSTRAINT "fee_charges_fee_schedule_id_fee_schedules_id_fk" FOREIGN KEY ("fee_schedule_id") REFERENCES "public"."fee_schedules"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fee_schedules" ADD CONSTRAINT "fee_schedules_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "flight_options" ADD CONSTRAINT "flight_options_trip_id_trips_id_fk" FOREIGN KEY ("trip_id") REFERENCES "public"."trips"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "flight_options" ADD CONSTRAINT "flight_options_saved_by_users_id_fk" FOREIGN KEY ("saved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "games" ADD CONSTRAINT "games_round_id_rounds_id_fk" FOREIGN KEY ("round_id") REFERENCES "public"."rounds"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "games" ADD CONSTRAINT "games_template_id_game_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."game_templates"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "itinerary_items" ADD CONSTRAINT "itinerary_items_trip_id_trips_id_fk" FOREIGN KEY ("trip_id") REFERENCES "public"."trips"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "itinerary_items" ADD CONSTRAINT "itinerary_items_related_reservation_id_reservations_id_fk" FOREIGN KEY ("related_reservation_id") REFERENCES "public"."reservations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "itinerary_items" ADD CONSTRAINT "itinerary_items_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lodging_options" ADD CONSTRAINT "lodging_options_trip_id_trips_id_fk" FOREIGN KEY ("trip_id") REFERENCES "public"."trips"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lodging_options" ADD CONSTRAINT "lodging_options_saved_by_users_id_fk" FOREIGN KEY ("saved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "membership_entitlements" ADD CONSTRAINT "membership_entitlements_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "microsites" ADD CONSTRAINT "microsites_trip_id_trips_id_fk" FOREIGN KEY ("trip_id") REFERENCES "public"."trips"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_trip_id_trips_id_fk" FOREIGN KEY ("trip_id") REFERENCES "public"."trips"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "photo_assets" ADD CONSTRAINT "photo_assets_trip_id_trips_id_fk" FOREIGN KEY ("trip_id") REFERENCES "public"."trips"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "photo_assets" ADD CONSTRAINT "photo_assets_uploader_id_users_id_fk" FOREIGN KEY ("uploader_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "photo_consents" ADD CONSTRAINT "photo_consents_photo_asset_id_photo_assets_id_fk" FOREIGN KEY ("photo_asset_id") REFERENCES "public"."photo_assets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "photo_consents" ADD CONSTRAINT "photo_consents_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "photo_tags" ADD CONSTRAINT "photo_tags_photo_asset_id_photo_assets_id_fk" FOREIGN KEY ("photo_asset_id") REFERENCES "public"."photo_assets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "photo_tags" ADD CONSTRAINT "photo_tags_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "photo_tags" ADD CONSTRAINT "photo_tags_tagged_by_id_users_id_fk" FOREIGN KEY ("tagged_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reservation_swaps" ADD CONSTRAINT "reservation_swaps_trip_id_trips_id_fk" FOREIGN KEY ("trip_id") REFERENCES "public"."trips"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reservation_swaps" ADD CONSTRAINT "reservation_swaps_old_reservation_id_reservations_id_fk" FOREIGN KEY ("old_reservation_id") REFERENCES "public"."reservations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reservation_swaps" ADD CONSTRAINT "reservation_swaps_new_reservation_id_reservations_id_fk" FOREIGN KEY ("new_reservation_id") REFERENCES "public"."reservations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reservation_swaps" ADD CONSTRAINT "reservation_swaps_decided_by_users_id_fk" FOREIGN KEY ("decided_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_booking_request_id_booking_requests_id_fk" FOREIGN KEY ("booking_request_id") REFERENCES "public"."booking_requests"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_booking_slot_id_booking_slots_id_fk" FOREIGN KEY ("booking_slot_id") REFERENCES "public"."booking_slots"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_trip_id_trips_id_fk" FOREIGN KEY ("trip_id") REFERENCES "public"."trips"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rounds" ADD CONSTRAINT "rounds_trip_id_trips_id_fk" FOREIGN KEY ("trip_id") REFERENCES "public"."trips"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rounds" ADD CONSTRAINT "rounds_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "score_entries" ADD CONSTRAINT "score_entries_round_id_rounds_id_fk" FOREIGN KEY ("round_id") REFERENCES "public"."rounds"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "score_entries" ADD CONSTRAINT "score_entries_player_id_users_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "settlement_actions" ADD CONSTRAINT "settlement_actions_trip_id_trips_id_fk" FOREIGN KEY ("trip_id") REFERENCES "public"."trips"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "settlement_actions" ADD CONSTRAINT "settlement_actions_from_user_id_users_id_fk" FOREIGN KEY ("from_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "settlement_actions" ADD CONSTRAINT "settlement_actions_to_user_id_users_id_fk" FOREIGN KEY ("to_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trip_expenses" ADD CONSTRAINT "trip_expenses_trip_id_trips_id_fk" FOREIGN KEY ("trip_id") REFERENCES "public"."trips"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trip_expenses" ADD CONSTRAINT "trip_expenses_payer_id_users_id_fk" FOREIGN KEY ("payer_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trip_members" ADD CONSTRAINT "trip_members_trip_id_trips_id_fk" FOREIGN KEY ("trip_id") REFERENCES "public"."trips"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trip_members" ADD CONSTRAINT "trip_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trip_members" ADD CONSTRAINT "trip_members_invited_by_users_id_fk" FOREIGN KEY ("invited_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trip_options" ADD CONSTRAINT "trip_options_trip_id_trips_id_fk" FOREIGN KEY ("trip_id") REFERENCES "public"."trips"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trip_options" ADD CONSTRAINT "trip_options_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trip_series" ADD CONSTRAINT "trip_series_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trips" ADD CONSTRAINT "trips_creator_id_users_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trips" ADD CONSTRAINT "trips_series_id_trip_series_id_fk" FOREIGN KEY ("series_id") REFERENCES "public"."trip_series"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "votes" ADD CONSTRAINT "votes_trip_option_id_trip_options_id_fk" FOREIGN KEY ("trip_option_id") REFERENCES "public"."trip_options"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "votes" ADD CONSTRAINT "votes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_activity_trip_created" ON "activity_feed_entries" USING btree ("trip_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_airports_iata_code" ON "airports" USING btree ("iata_code");--> statement-breakpoint
CREATE INDEX "idx_bet_participants_bet" ON "bet_participants" USING btree ("bet_id");--> statement-breakpoint
CREATE INDEX "idx_bet_participants_user" ON "bet_participants" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_bet_participants_status" ON "bet_participants" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_bets_trip" ON "bets" USING btree ("trip_id");--> statement-breakpoint
CREATE INDEX "idx_bets_round" ON "bets" USING btree ("round_id");--> statement-breakpoint
CREATE INDEX "idx_bets_status" ON "bets" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_booking_requests_trip" ON "booking_requests" USING btree ("trip_id");--> statement-breakpoint
CREATE INDEX "idx_booking_requests_course" ON "booking_requests" USING btree ("course_id");--> statement-breakpoint
CREATE INDEX "idx_booking_requests_status" ON "booking_requests" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_booking_slots_request" ON "booking_slots" USING btree ("booking_request_id");--> statement-breakpoint
CREATE INDEX "idx_course_composites_course" ON "course_composites" USING btree ("course_id");--> statement-breakpoint
CREATE INDEX "idx_course_reports_course" ON "course_reports" USING btree ("course_id");--> statement-breakpoint
CREATE INDEX "idx_course_reports_status" ON "course_reports" USING btree ("report_status");--> statement-breakpoint
CREATE INDEX "idx_course_reviews_course" ON "course_reviews" USING btree ("course_id");--> statement-breakpoint
CREATE INDEX "idx_course_reviews_user" ON "course_reviews" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_course_rules_course" ON "course_rules" USING btree ("course_id");--> statement-breakpoint
CREATE INDEX "idx_courses_access_type" ON "courses" USING btree ("access_type");--> statement-breakpoint
CREATE INDEX "idx_courses_course_status" ON "courses" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_courses_state" ON "courses" USING btree ("state");--> statement-breakpoint
CREATE INDEX "idx_courses_price_max" ON "courses" USING btree ("price_band_max");--> statement-breakpoint
CREATE INDEX "idx_external_bookings_trip" ON "external_bookings" USING btree ("trip_id");--> statement-breakpoint
CREATE INDEX "idx_fee_charges_trip_id" ON "fee_charges" USING btree ("trip_id");--> statement-breakpoint
CREATE INDEX "idx_fee_charges_user_id" ON "fee_charges" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_fee_charges_status" ON "fee_charges" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_fee_charges_source_object_id" ON "fee_charges" USING btree ("source_object_id");--> statement-breakpoint
CREATE INDEX "idx_fee_schedules_fee_type" ON "fee_schedules" USING btree ("fee_type");--> statement-breakpoint
CREATE INDEX "idx_fee_schedules_effective_from" ON "fee_schedules" USING btree ("effective_from");--> statement-breakpoint
CREATE INDEX "idx_flight_options_trip" ON "flight_options" USING btree ("trip_id");--> statement-breakpoint
CREATE INDEX "idx_games_round" ON "games" USING btree ("round_id");--> statement-breakpoint
CREATE INDEX "idx_games_status" ON "games" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_itinerary_items_trip_date" ON "itinerary_items" USING btree ("trip_id","date");--> statement-breakpoint
CREATE INDEX "idx_lodging_options_trip" ON "lodging_options" USING btree ("trip_id");--> statement-breakpoint
CREATE INDEX "idx_memberships_user_id" ON "membership_entitlements" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_memberships_network" ON "membership_entitlements" USING btree ("network_name");--> statement-breakpoint
CREATE INDEX "idx_microsites_slug" ON "microsites" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "idx_microsites_trip" ON "microsites" USING btree ("trip_id");--> statement-breakpoint
CREATE INDEX "idx_microsites_publish_state" ON "microsites" USING btree ("publish_state");--> statement-breakpoint
CREATE INDEX "idx_notification_prefs_user" ON "notification_preferences" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_notifications_user_read" ON "notifications" USING btree ("user_id","read_at","created_at");--> statement-breakpoint
CREATE INDEX "idx_notifications_user_created" ON "notifications" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_photo_assets_trip" ON "photo_assets" USING btree ("trip_id");--> statement-breakpoint
CREATE INDEX "idx_photo_assets_uploader" ON "photo_assets" USING btree ("uploader_id");--> statement-breakpoint
CREATE INDEX "idx_photo_assets_publish_state" ON "photo_assets" USING btree ("publish_state");--> statement-breakpoint
CREATE INDEX "idx_photo_consents_photo_asset" ON "photo_consents" USING btree ("photo_asset_id");--> statement-breakpoint
CREATE INDEX "idx_photo_consents_status" ON "photo_consents" USING btree ("consent_state");--> statement-breakpoint
CREATE INDEX "idx_photo_tags_photo_asset" ON "photo_tags" USING btree ("photo_asset_id");--> statement-breakpoint
CREATE INDEX "idx_photo_tags_user" ON "photo_tags" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_reservation_swaps_trip" ON "reservation_swaps" USING btree ("trip_id");--> statement-breakpoint
CREATE INDEX "idx_reservation_swaps_old_res" ON "reservation_swaps" USING btree ("old_reservation_id");--> statement-breakpoint
CREATE INDEX "idx_reservation_swaps_state" ON "reservation_swaps" USING btree ("approval_state");--> statement-breakpoint
CREATE INDEX "idx_reservations_trip" ON "reservations" USING btree ("trip_id");--> statement-breakpoint
CREATE INDEX "idx_reservations_course" ON "reservations" USING btree ("course_id");--> statement-breakpoint
CREATE INDEX "idx_reservations_booking_request" ON "reservations" USING btree ("booking_request_id");--> statement-breakpoint
CREATE INDEX "idx_reservations_status" ON "reservations" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_rounds_trip" ON "rounds" USING btree ("trip_id");--> statement-breakpoint
CREATE INDEX "idx_rounds_course" ON "rounds" USING btree ("course_id");--> statement-breakpoint
CREATE INDEX "idx_rounds_status" ON "rounds" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_score_entries_round" ON "score_entries" USING btree ("round_id");--> statement-breakpoint
CREATE INDEX "idx_score_entries_player" ON "score_entries" USING btree ("player_id");--> statement-breakpoint
CREATE INDEX "idx_settlement_actions_trip" ON "settlement_actions" USING btree ("trip_id");--> statement-breakpoint
CREATE INDEX "idx_settlement_actions_from_user" ON "settlement_actions" USING btree ("from_user_id");--> statement-breakpoint
CREATE INDEX "idx_settlement_actions_to_user" ON "settlement_actions" USING btree ("to_user_id");--> statement-breakpoint
CREATE INDEX "idx_settlement_actions_status" ON "settlement_actions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_trip_expenses_trip" ON "trip_expenses" USING btree ("trip_id");--> statement-breakpoint
CREATE INDEX "idx_trip_expenses_payer" ON "trip_expenses" USING btree ("payer_id");--> statement-breakpoint
CREATE INDEX "idx_trip_members_trip" ON "trip_members" USING btree ("trip_id");--> statement-breakpoint
CREATE INDEX "idx_trip_members_user" ON "trip_members" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_trip_members_token" ON "trip_members" USING btree ("invite_token");--> statement-breakpoint
CREATE INDEX "idx_trip_options_trip" ON "trip_options" USING btree ("trip_id");--> statement-breakpoint
CREATE INDEX "idx_trips_creator" ON "trips" USING btree ("creator_id");--> statement-breakpoint
CREATE INDEX "idx_trips_status" ON "trips" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_votes_option" ON "votes" USING btree ("trip_option_id");--> statement-breakpoint
CREATE INDEX "idx_votes_user" ON "votes" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_courses_location" ON "courses" USING GIST ("location");--> statement-breakpoint
CREATE INDEX "idx_airports_location" ON "airports" USING GIST ("location");--> statement-breakpoint
CREATE INDEX "idx_courses_playable" ON "courses" USING GIST ("location") WHERE "access_type" IN ('public', 'resort', 'semi_private') AND "status" = 'active';
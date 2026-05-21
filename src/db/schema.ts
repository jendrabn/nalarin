import {
  bigint,
  boolean,
  date,
  decimal,
  index,
  int,
  json,
  longtext,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from 'drizzle-orm/mysql-core';

export const userRoleValues = ['user', 'admin'] as const;
export const userStatusValues = ['active', 'inactive', 'suspended'] as const;
export const genderValues = ['male', 'female'] as const;
export const planCodeValues = ['free', 'pro', 'max'] as const;
export const questionTypeValues = [
  'multiple_choice',
  'multiple_answer',
  'short_answer',
  'true_false',
] as const;
export const questionDifficultyValues = ['easy', 'medium', 'hard'] as const;
export const scoringRuleValues = ['all_or_nothing', 'partial'] as const;
export const contentStatusValues = ['draft', 'published', 'archived'] as const;
export const sessionStatusValues = [
  'pending',
  'in_progress',
  'submitted',
  'grading',
  'graded',
  'cancelled',
] as const;
export const practiceModeValues = ['practice', 'quiz'] as const;
export const navigationModeValues = ['free', 'sequential'] as const;
export const answerGradingStatusValues = [
  'not_required',
  'pending',
  'graded',
  'needs_review',
] as const;
export const gradingSourceValues = ['manual', 'ai', 'auto'] as const;
export const paymentStatusValues = [
  'pending',
  'paid',
  'failed',
  'expired',
  'cancelled',
  'refunded',
] as const;
export const paymentGatewayValues = ['midtrans', 'manual'] as const;
export const paymentMethodValues = [
  'bank_transfer',
  'e_wallet',
  'qris',
  'credit_card',
  'convenience_store',
  'manual_transfer',
  'other',
] as const;
export const transactionSourceValues = [
  'midtrans_webhook',
  'user_checkout',
  'admin_manual',
] as const;
export const subscriptionStatusValues = ['active', 'expired', 'cancelled'] as const;
export const subscriptionSourceValues = ['midtrans', 'manual', 'admin_grant'] as const;

export const userRoleEnum = mysqlEnum('role', userRoleValues);
export const userStatusEnum = mysqlEnum('status', userStatusValues);
export const genderEnum = mysqlEnum('gender', genderValues);
export const planCodeEnum = mysqlEnum('plan_code', planCodeValues);
export const questionTypeEnum = mysqlEnum('type', questionTypeValues);
export const questionDifficultyEnum = mysqlEnum(
  'difficulty',
  questionDifficultyValues,
);
export const scoringRuleEnum = mysqlEnum('scoring_rule', scoringRuleValues);
export const contentStatusEnum = mysqlEnum('status', contentStatusValues);
export const sessionStatusEnum = mysqlEnum('status', sessionStatusValues);
export const practiceModeEnum = mysqlEnum('mode', practiceModeValues);
export const navigationModeEnum = mysqlEnum(
  'navigation_mode',
  navigationModeValues,
);
export const answerGradingStatusEnum = mysqlEnum(
  'grading_status',
  answerGradingStatusValues,
);
export const gradingSourceEnum = mysqlEnum(
  'grading_source',
  gradingSourceValues,
);
export const paymentStatusEnum = mysqlEnum('status', paymentStatusValues);
export const paymentGatewayEnum = mysqlEnum('gateway', paymentGatewayValues);
export const paymentMethodEnum = mysqlEnum(
  'payment_method',
  paymentMethodValues,
);
export const transactionSourceEnum = mysqlEnum(
  'transaction_source',
  transactionSourceValues,
);
export const subscriptionStatusEnum = mysqlEnum(
  'status',
  subscriptionStatusValues,
);
export const subscriptionSourceEnum = mysqlEnum(
  'source',
  subscriptionSourceValues,
);

type JsonObject = Record<string, unknown>;
type JsonArray = JsonObject[];
type SelectedOptionKeys = string[];
type TopicAccuracySnapshot = {
  topic_id: number;
  topic_name: string;
  accuracy: number;
};

const createdAt = () =>
  timestamp('created_at', { mode: 'date' }).defaultNow().notNull();

const updatedAt = () =>
  timestamp('updated_at', { mode: 'date' })
    .defaultNow()
    .onUpdateNow()
    .notNull();

const auditColumns = () => ({
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

const scoreColumn = (name: string) =>
  decimal(name, { precision: 10, scale: 2 });

const penaltyColumn = (name: string) =>
  decimal(name, { precision: 5, scale: 2 });

export const users = mysqlTable(
  'users',
  {
    id: int('id', { unsigned: true }).autoincrement().primaryKey(),
    name: varchar('name', { length: 255 }).notNull(),
    email: varchar('email', { length: 191 }).notNull(),
    emailVerifiedAt: timestamp('email_verified_at', { mode: 'date' }),
    passwordHash: varchar('password_hash', { length: 255 }),
    googleId: varchar('google_id', { length: 255 }),
    avatarUrl: varchar('avatar_url', { length: 2048 }),
    role: userRoleEnum.default('user').notNull(),
    status: userStatusEnum.default('active').notNull(),
    gender: genderEnum,
    birthDate: date('birth_date', { mode: 'string' }),
    phoneNumber: varchar('phone_number', { length: 32 }),
    bio: text('bio'),
    ...auditColumns(),
  },
  (table) => [
    uniqueIndex('users_email_uq').on(table.email),
    uniqueIndex('users_google_id_uq').on(table.googleId),
    index('users_role_status_idx').on(table.role, table.status),
    index('users_status_created_at_idx').on(table.status, table.createdAt),
  ],
);

export const userSessions = mysqlTable(
  'user_sessions',
  {
    id: int('id', { unsigned: true }).autoincrement().primaryKey(),
    userId: int('user_id', { unsigned: true })
      .notNull()
      .references(() => users.id),
    sessionTokenHash: varchar('session_token_hash', { length: 255 }).notNull(),
    expiresAt: timestamp('expires_at', { mode: 'date' }).notNull(),
    lastActiveAt: timestamp('last_active_at', { mode: 'date' }).notNull(),
    ipAddress: varchar('ip_address', { length: 45 }),
    userAgent: varchar('user_agent', { length: 1024 }),
    revokedAt: timestamp('revoked_at', { mode: 'date' }),
    ...auditColumns(),
  },
  (table) => [
    uniqueIndex('user_sessions_token_hash_uq').on(table.sessionTokenHash),
    index('user_sessions_user_validity_idx').on(
      table.userId,
      table.revokedAt,
      table.expiresAt,
    ),
    index('user_sessions_expires_at_idx').on(table.expiresAt),
  ],
);

export const emailVerificationTokens = mysqlTable(
  'email_verification_tokens',
  {
    id: int('id', { unsigned: true }).autoincrement().primaryKey(),
    userId: int('user_id', { unsigned: true })
      .notNull()
      .references(() => users.id),
    tokenHash: varchar('token_hash', { length: 255 }).notNull(),
    expiresAt: timestamp('expires_at', { mode: 'date' }).notNull(),
    usedAt: timestamp('used_at', { mode: 'date' }),
    invalidatedAt: timestamp('invalidated_at', { mode: 'date' }),
    createdAt: createdAt(),
  },
  (table) => [
    uniqueIndex('email_verification_tokens_hash_uq').on(table.tokenHash),
    index('email_verification_tokens_user_validity_idx').on(
      table.userId,
      table.invalidatedAt,
      table.usedAt,
      table.expiresAt,
    ),
  ],
);

export const passwordResetTokens = mysqlTable(
  'password_reset_tokens',
  {
    id: int('id', { unsigned: true }).autoincrement().primaryKey(),
    userId: int('user_id', { unsigned: true })
      .notNull()
      .references(() => users.id),
    tokenHash: varchar('token_hash', { length: 255 }).notNull(),
    expiresAt: timestamp('expires_at', { mode: 'date' }).notNull(),
    usedAt: timestamp('used_at', { mode: 'date' }),
    invalidatedAt: timestamp('invalidated_at', { mode: 'date' }),
    createdAt: createdAt(),
  },
  (table) => [
    uniqueIndex('password_reset_tokens_hash_uq').on(table.tokenHash),
    index('password_reset_tokens_user_validity_idx').on(
      table.userId,
      table.invalidatedAt,
      table.usedAt,
      table.expiresAt,
    ),
  ],
);

export const emailChangeTokens = mysqlTable(
  'email_change_tokens',
  {
    id: int('id', { unsigned: true }).autoincrement().primaryKey(),
    userId: int('user_id', { unsigned: true })
      .notNull()
      .references(() => users.id),
    newEmail: varchar('new_email', { length: 191 }).notNull(),
    tokenHash: varchar('token_hash', { length: 255 }).notNull(),
    expiresAt: timestamp('expires_at', { mode: 'date' }).notNull(),
    usedAt: timestamp('used_at', { mode: 'date' }),
    invalidatedAt: timestamp('invalidated_at', { mode: 'date' }),
    createdAt: createdAt(),
  },
  (table) => [
    uniqueIndex('email_change_tokens_hash_uq').on(table.tokenHash),
    index('email_change_tokens_user_validity_idx').on(
      table.userId,
      table.invalidatedAt,
      table.usedAt,
      table.expiresAt,
    ),
  ],
);

export const examTypes = mysqlTable(
  'exam_types',
  {
    id: int('id', { unsigned: true }).autoincrement().primaryKey(),
    name: varchar('name', { length: 100 }).notNull(),
    slug: varchar('slug', { length: 191 }).notNull(),
    description: text('description'),
    logoUrl: varchar('logo_url', { length: 2048 }),
    ...auditColumns(),
  },
  (table) => [uniqueIndex('exam_types_slug_uq').on(table.slug)],
);

export const subjects = mysqlTable(
  'subjects',
  {
    id: int('id', { unsigned: true }).autoincrement().primaryKey(),
    examTypeId: int('exam_type_id', { unsigned: true })
      .notNull()
      .references(() => examTypes.id),
    name: varchar('name', { length: 150 }).notNull(),
    slug: varchar('slug', { length: 191 }).notNull(),
    description: text('description'),
    logoUrl: varchar('logo_url', { length: 2048 }),
    ...auditColumns(),
  },
  (table) => [
    uniqueIndex('subjects_exam_type_slug_uq').on(table.examTypeId, table.slug),
    index('subjects_exam_type_name_idx').on(table.examTypeId, table.name),
  ],
);

export const topics = mysqlTable(
  'topics',
  {
    id: int('id', { unsigned: true }).autoincrement().primaryKey(),
    subjectId: int('subject_id', { unsigned: true })
      .notNull()
      .references(() => subjects.id),
    name: varchar('name', { length: 150 }).notNull(),
    slug: varchar('slug', { length: 191 }).notNull(),
    description: text('description'),
    ...auditColumns(),
  },
  (table) => [
    uniqueIndex('topics_subject_slug_uq').on(table.subjectId, table.slug),
    index('topics_subject_name_idx').on(table.subjectId, table.name),
  ],
);

export const questions = mysqlTable(
  'questions',
  {
    id: int('id', { unsigned: true }).autoincrement().primaryKey(),
    subjectId: int('subject_id', { unsigned: true })
      .notNull()
      .references(() => subjects.id),
    topicId: int('topic_id', { unsigned: true }).references(() => topics.id),
    type: questionTypeEnum.notNull(),
    difficulty: questionDifficultyEnum.notNull(),
    scoringRule: scoringRuleEnum,
    title: varchar('title', { length: 255 }),
    content: longtext('content').notNull(),
    imageUrl: varchar('image_url', { length: 2048 }),
    correctAnswerText: longtext('correct_answer_text'),
    gradingRubric: longtext('grading_rubric'),
    explanation: longtext('explanation'),
    year: int('year', { unsigned: true }),
    points: scoreColumn('points').notNull(),
    status: contentStatusEnum.notNull(),
    createdBy: int('created_by', { unsigned: true }).references(() => users.id),
    ...auditColumns(),
  },
  (table) => [
    index('questions_subject_status_type_idx').on(
      table.subjectId,
      table.status,
      table.type,
    ),
    index('questions_topic_status_idx').on(table.topicId, table.status),
    index('questions_status_difficulty_idx').on(
      table.status,
      table.difficulty,
      table.updatedAt,
    ),
    index('questions_created_by_idx').on(table.createdBy),
  ],
);

export const questionOptions = mysqlTable(
  'question_options',
  {
    id: int('id', { unsigned: true }).autoincrement().primaryKey(),
    questionId: int('question_id', { unsigned: true })
      .notNull()
      .references(() => questions.id),
    label: varchar('label', { length: 20 }).notNull(),
    content: longtext('content').notNull(),
    imageUrl: varchar('image_url', { length: 2048 }),
    isCorrect: boolean('is_correct').default(false).notNull(),
    ...auditColumns(),
  },
  (table) => [
    index('question_options_question_idx').on(table.questionId),
    index('question_options_question_correct_idx').on(
      table.questionId,
      table.isCorrect,
    ),
  ],
);

export const practices = mysqlTable(
  'practices',
  {
    id: int('id', { unsigned: true }).autoincrement().primaryKey(),
    examTypeId: int('exam_type_id', { unsigned: true })
      .notNull()
      .references(() => examTypes.id),
    subjectId: int('subject_id', { unsigned: true })
      .notNull()
      .references(() => subjects.id),
    topicId: int('topic_id', { unsigned: true }).references(() => topics.id),
    title: varchar('title', { length: 255 }).notNull(),
    slug: varchar('slug', { length: 191 }).notNull(),
    description: text('description'),
    isFree: boolean('is_free').notNull(),
    hasPracticeMode: boolean('has_practice_mode').default(true).notNull(),
    hasQuizMode: boolean('has_quiz_mode').default(true).notNull(),
    quizDurationMinutes: int('quiz_duration_minutes', { unsigned: true }),
    shuffleQuestions: boolean('shuffle_questions').notNull(),
    shuffleOptions: boolean('shuffle_options').notNull(),
    allowReviewBeforeSubmit: boolean('allow_review_before_submit').notNull(),
    showResultAfterSubmit: boolean('show_result_after_submit').notNull(),
    showExplanationAfterSubmit: boolean('show_explanation_after_submit').notNull(),
    navigationMode: navigationModeEnum.notNull(),
    status: contentStatusEnum.notNull(),
    publishedAt: timestamp('published_at', { mode: 'date' }),
    createdBy: int('created_by', { unsigned: true }).references(() => users.id),
    ...auditColumns(),
  },
  (table) => [
    uniqueIndex('practices_exam_type_slug_uq').on(table.examTypeId, table.slug),
    index('practices_bank_filter_idx').on(
      table.examTypeId,
      table.subjectId,
      table.topicId,
      table.status,
      table.isFree,
    ),
    index('practices_status_publish_idx').on(table.status, table.publishedAt),
    index('practices_created_by_idx').on(table.createdBy),
  ],
);

export const practiceQuestions = mysqlTable(
  'practice_questions',
  {
    id: int('id', { unsigned: true }).autoincrement().primaryKey(),
    practiceId: int('practice_id', { unsigned: true })
      .notNull()
      .references(() => practices.id),
    questionId: int('question_id', { unsigned: true })
      .notNull()
      .references(() => questions.id),
    orderIndex: int('order_index', { unsigned: true }).notNull(),
    points: scoreColumn('points'),
    createdAt: createdAt(),
  },
  (table) => [
    uniqueIndex('practice_questions_practice_question_uq').on(
      table.practiceId,
      table.questionId,
    ),
    uniqueIndex('practice_questions_practice_order_uq').on(
      table.practiceId,
      table.orderIndex,
    ),
    index('practice_questions_question_idx').on(table.questionId),
  ],
);

export const practiceSessions = mysqlTable(
  'practice_sessions',
  {
    id: int('id', { unsigned: true }).autoincrement().primaryKey(),
    practiceId: int('practice_id', { unsigned: true })
      .notNull()
      .references(() => practices.id),
    userId: int('user_id', { unsigned: true })
      .notNull()
      .references(() => users.id),
    mode: practiceModeEnum.notNull(),
    status: sessionStatusEnum.default('in_progress').notNull(),
    totalQuestions: int('total_questions', { unsigned: true }).default(0).notNull(),
    totalCorrect: int('total_correct', { unsigned: true }).default(0).notNull(),
    totalWrong: int('total_wrong', { unsigned: true }).default(0).notNull(),
    totalUnanswered: int('total_unanswered', { unsigned: true })
      .default(0)
      .notNull(),
    totalScore: scoreColumn('total_score').default('0.00').notNull(),
    totalMaxScore: scoreColumn('total_max_score').default('0.00').notNull(),
    durationMinutes: int('duration_minutes', { unsigned: true }),
    currentQuestionOrder: int('current_question_order', { unsigned: true }),
    startedAt: timestamp('started_at', { mode: 'date' }).notNull(),
    submittedAt: timestamp('submitted_at', { mode: 'date' }),
    gradedAt: timestamp('graded_at', { mode: 'date' }),
    lastSavedAt: timestamp('last_saved_at', { mode: 'date' }),
    ...auditColumns(),
  },
  (table) => [
    index('practice_sessions_user_practice_status_idx').on(
      table.userId,
      table.practiceId,
      table.status,
    ),
    index('practice_sessions_user_created_at_idx').on(
      table.userId,
      table.createdAt,
    ),
    index('practice_sessions_status_last_saved_idx').on(
      table.status,
      table.lastSavedAt,
    ),
    index('practice_sessions_practice_status_idx').on(
      table.practiceId,
      table.status,
    ),
  ],
);

export const practiceSessionQuestions = mysqlTable(
  'practice_session_questions',
  {
    id: int('id', { unsigned: true }).autoincrement().primaryKey(),
    practiceSessionId: int('practice_session_id', { unsigned: true })
      .notNull()
      .references(() => practiceSessions.id),
    practiceQuestionId: int('practice_question_id', { unsigned: true })
      .notNull()
      .references(() => practiceQuestions.id),
    questionId: int('question_id', { unsigned: true })
      .notNull()
      .references(() => questions.id),
    orderIndex: int('order_index', { unsigned: true }).notNull(),
    questionSnapshot: json('question_snapshot').$type<JsonObject>().notNull(),
    optionSnapshot: json('option_snapshot').$type<JsonArray>().notNull(),
    correctAnswerSnapshot: json('correct_answer_snapshot')
      .$type<JsonObject>()
      .notNull(),
    points: scoreColumn('points').notNull(),
    createdAt: createdAt(),
  },
  (table) => [
    uniqueIndex('practice_session_questions_session_practice_question_uq').on(
      table.practiceSessionId,
      table.practiceQuestionId,
    ),
    index('practice_session_questions_session_order_idx').on(
      table.practiceSessionId,
      table.orderIndex,
    ),
    index('practice_session_questions_question_idx').on(table.questionId),
  ],
);

export const practiceAnswers = mysqlTable(
  'practice_answers',
  {
    id: int('id', { unsigned: true }).autoincrement().primaryKey(),
    practiceSessionId: int('practice_session_id', { unsigned: true })
      .notNull()
      .references(() => practiceSessions.id),
    practiceSessionQuestionId: int('practice_session_question_id', {
      unsigned: true,
    })
      .notNull()
      .references(() => practiceSessionQuestions.id),
    questionType: mysqlEnum('question_type', questionTypeValues).notNull(),
    selectedOptionKeys: json('selected_option_keys').$type<SelectedOptionKeys>(),
    answerText: longtext('answer_text'),
    isMarkedForReview: boolean('is_marked_for_review')
      .default(false)
      .notNull(),
    isCorrect: boolean('is_correct'),
    score: scoreColumn('score'),
    maxScore: scoreColumn('max_score'),
    gradingStatus: answerGradingStatusEnum.notNull(),
    gradingSource: gradingSourceEnum,
    gradingFeedback: text('grading_feedback'),
    gradedAt: timestamp('graded_at', { mode: 'date' }),
    answeredAt: timestamp('answered_at', { mode: 'date' }),
    lastSavedAt: timestamp('last_saved_at', { mode: 'date' }),
    ...auditColumns(),
  },
  (table) => [
    uniqueIndex('practice_answers_session_question_uq').on(
      table.practiceSessionQuestionId,
    ),
    index('practice_answers_session_grading_idx').on(
      table.practiceSessionId,
      table.gradingStatus,
      table.gradedAt,
    ),
    index('practice_answers_grading_queue_idx').on(
      table.gradingStatus,
      table.questionType,
      table.updatedAt,
    ),
  ],
);

export const tryouts = mysqlTable(
  'tryouts',
  {
    id: int('id', { unsigned: true }).autoincrement().primaryKey(),
    examTypeId: int('exam_type_id', { unsigned: true })
      .notNull()
      .references(() => examTypes.id),
    title: varchar('title', { length: 255 }).notNull(),
    slug: varchar('slug', { length: 191 }).notNull(),
    description: text('description'),
    isFree: boolean('is_free').notNull(),
    startsAt: timestamp('starts_at', { mode: 'date' }),
    endsAt: timestamp('ends_at', { mode: 'date' }),
    shuffleQuestions: boolean('shuffle_questions').notNull(),
    shuffleOptions: boolean('shuffle_options').notNull(),
    allowReviewBeforeSubmit: boolean('allow_review_before_submit').notNull(),
    showResultAfterSubmit: boolean('show_result_after_submit').notNull(),
    resultReleaseAt: timestamp('result_release_at', { mode: 'date' }),
    showRankingAfterSubmit: boolean('show_ranking_after_submit').notNull(),
    rankingReleaseAt: timestamp('ranking_release_at', { mode: 'date' }),
    showExplanationAfterSubmit: boolean('show_explanation_after_submit').notNull(),
    explanationReleaseAt: timestamp('explanation_release_at', { mode: 'date' }),
    navigationMode: navigationModeEnum.notNull(),
    enforceEndTime: boolean('enforce_end_time').notNull(),
    wrongAnswerPenalty: penaltyColumn('wrong_answer_penalty')
      .default('0.00')
      .notNull(),
    status: contentStatusEnum.notNull(),
    publishedAt: timestamp('published_at', { mode: 'date' }),
    createdBy: int('created_by', { unsigned: true }).references(() => users.id),
    ...auditColumns(),
  },
  (table) => [
    uniqueIndex('tryouts_slug_uq').on(table.slug),
    index('tryouts_exam_type_status_idx').on(
      table.examTypeId,
      table.status,
      table.isFree,
    ),
    index('tryouts_schedule_idx').on(table.status, table.startsAt, table.endsAt),
    index('tryouts_publish_idx').on(table.status, table.publishedAt),
    index('tryouts_created_by_idx').on(table.createdBy),
  ],
);

export const tryoutSections = mysqlTable(
  'tryout_sections',
  {
    id: int('id', { unsigned: true }).autoincrement().primaryKey(),
    tryoutId: int('tryout_id', { unsigned: true })
      .notNull()
      .references(() => tryouts.id),
    subjectId: int('subject_id', { unsigned: true })
      .notNull()
      .references(() => subjects.id),
    title: varchar('title', { length: 255 }).notNull(),
    description: text('description'),
    durationMinutes: int('duration_minutes', { unsigned: true }).notNull(),
    orderIndex: int('order_index', { unsigned: true }).notNull(),
    wrongAnswerPenalty: penaltyColumn('wrong_answer_penalty'),
    ...auditColumns(),
  },
  (table) => [
    uniqueIndex('tryout_sections_tryout_order_uq').on(
      table.tryoutId,
      table.orderIndex,
    ),
    index('tryout_sections_tryout_order_idx').on(table.tryoutId, table.orderIndex),
    index('tryout_sections_subject_idx').on(table.subjectId),
  ],
);

export const tryoutQuestions = mysqlTable(
  'tryout_questions',
  {
    id: int('id', { unsigned: true }).autoincrement().primaryKey(),
    tryoutSectionId: int('tryout_section_id', { unsigned: true })
      .notNull()
      .references(() => tryoutSections.id),
    questionId: int('question_id', { unsigned: true })
      .notNull()
      .references(() => questions.id),
    orderIndex: int('order_index', { unsigned: true }).notNull(),
    points: scoreColumn('points'),
    createdAt: createdAt(),
  },
  (table) => [
    uniqueIndex('tryout_questions_section_question_uq').on(
      table.tryoutSectionId,
      table.questionId,
    ),
    uniqueIndex('tryout_questions_section_order_uq').on(
      table.tryoutSectionId,
      table.orderIndex,
    ),
    index('tryout_questions_question_idx').on(table.questionId),
  ],
);

export const tryoutSessions = mysqlTable(
  'tryout_sessions',
  {
    id: int('id', { unsigned: true }).autoincrement().primaryKey(),
    tryoutId: int('tryout_id', { unsigned: true })
      .notNull()
      .references(() => tryouts.id),
    userId: int('user_id', { unsigned: true })
      .notNull()
      .references(() => users.id),
    status: sessionStatusEnum.default('in_progress').notNull(),
    totalQuestions: int('total_questions', { unsigned: true }).default(0).notNull(),
    totalCorrect: int('total_correct', { unsigned: true }).default(0).notNull(),
    totalWrong: int('total_wrong', { unsigned: true }).default(0).notNull(),
    totalUnanswered: int('total_unanswered', { unsigned: true })
      .default(0)
      .notNull(),
    totalScore: scoreColumn('total_score').default('0.00').notNull(),
    totalMaxScore: scoreColumn('total_max_score').default('0.00').notNull(),
    totalSectionsStarted: int('total_sections_started', { unsigned: true })
      .default(0)
      .notNull(),
    durationUsedSeconds: int('duration_used_seconds', { unsigned: true })
      .default(0)
      .notNull(),
    autoSubmitted: boolean('auto_submitted').default(false).notNull(),
    startedAt: timestamp('started_at', { mode: 'date' }).notNull(),
    submittedAt: timestamp('submitted_at', { mode: 'date' }),
    gradedAt: timestamp('graded_at', { mode: 'date' }),
    lastSavedAt: timestamp('last_saved_at', { mode: 'date' }),
    cancelledAt: timestamp('cancelled_at', { mode: 'date' }),
    cancellationReason: text('cancellation_reason'),
    ...auditColumns(),
  },
  (table) => [
    index('tryout_sessions_user_tryout_status_idx').on(
      table.userId,
      table.tryoutId,
      table.status,
    ),
    index('tryout_sessions_ranking_idx').on(
      table.tryoutId,
      table.status,
      table.totalScore,
      table.totalSectionsStarted,
      table.totalCorrect,
      table.durationUsedSeconds,
      table.submittedAt,
    ),
    index('tryout_sessions_status_last_saved_idx').on(
      table.status,
      table.lastSavedAt,
    ),
    index('tryout_sessions_user_created_at_idx').on(
      table.userId,
      table.createdAt,
    ),
  ],
);

export const tryoutSectionSessions = mysqlTable(
  'tryout_section_sessions',
  {
    id: int('id', { unsigned: true }).autoincrement().primaryKey(),
    tryoutSessionId: int('tryout_session_id', { unsigned: true })
      .notNull()
      .references(() => tryoutSessions.id),
    tryoutSectionId: int('tryout_section_id', { unsigned: true })
      .notNull()
      .references(() => tryoutSections.id),
    status: sessionStatusEnum.default('pending').notNull(),
    durationMinutes: int('duration_minutes', { unsigned: true }).notNull(),
    wrongAnswerPenalty: penaltyColumn('wrong_answer_penalty')
      .default('0.00')
      .notNull(),
    totalQuestions: int('total_questions', { unsigned: true }).default(0).notNull(),
    correctCount: int('correct_count', { unsigned: true }).default(0).notNull(),
    wrongCount: int('wrong_count', { unsigned: true }).default(0).notNull(),
    unansweredCount: int('unanswered_count', { unsigned: true })
      .default(0)
      .notNull(),
    score: scoreColumn('score').default('0.00').notNull(),
    currentQuestionOrder: int('current_question_order', { unsigned: true }),
    startedAt: timestamp('started_at', { mode: 'date' }),
    submittedAt: timestamp('submitted_at', { mode: 'date' }),
    gradedAt: timestamp('graded_at', { mode: 'date' }),
    lastSavedAt: timestamp('last_saved_at', { mode: 'date' }),
    ...auditColumns(),
  },
  (table) => [
    uniqueIndex('tryout_section_sessions_session_section_uq').on(
      table.tryoutSessionId,
      table.tryoutSectionId,
    ),
    index('tryout_section_sessions_session_status_idx').on(
      table.tryoutSessionId,
      table.status,
      table.startedAt,
    ),
    index('tryout_section_sessions_status_last_saved_idx').on(
      table.status,
      table.lastSavedAt,
    ),
    index('tryout_section_sessions_section_idx').on(table.tryoutSectionId),
  ],
);

export const tryoutSessionQuestions = mysqlTable(
  'tryout_session_questions',
  {
    id: int('id', { unsigned: true }).autoincrement().primaryKey(),
    tryoutSessionId: int('tryout_session_id', { unsigned: true })
      .notNull()
      .references(() => tryoutSessions.id),
    tryoutSectionSessionId: int('tryout_section_session_id', { unsigned: true })
      .notNull()
      .references(() => tryoutSectionSessions.id),
    tryoutQuestionId: int('tryout_question_id', { unsigned: true })
      .notNull()
      .references(() => tryoutQuestions.id),
    questionId: int('question_id', { unsigned: true })
      .notNull()
      .references(() => questions.id),
    orderIndex: int('order_index', { unsigned: true }).notNull(),
    questionSnapshot: json('question_snapshot').$type<JsonObject>().notNull(),
    optionSnapshot: json('option_snapshot').$type<JsonArray>().notNull(),
    correctAnswerSnapshot: json('correct_answer_snapshot')
      .$type<JsonObject>()
      .notNull(),
    points: scoreColumn('points').notNull(),
    createdAt: createdAt(),
  },
  (table) => [
    uniqueIndex('tryout_session_questions_session_tryout_question_uq').on(
      table.tryoutSessionId,
      table.tryoutQuestionId,
    ),
    index('tryout_session_questions_section_order_idx').on(
      table.tryoutSectionSessionId,
      table.orderIndex,
    ),
    index('tryout_session_questions_question_idx').on(table.questionId),
  ],
);

export const tryoutAnswers = mysqlTable(
  'tryout_answers',
  {
    id: int('id', { unsigned: true }).autoincrement().primaryKey(),
    tryoutSessionId: int('tryout_session_id', { unsigned: true })
      .notNull()
      .references(() => tryoutSessions.id),
    tryoutSectionSessionId: int('tryout_section_session_id', { unsigned: true })
      .notNull()
      .references(() => tryoutSectionSessions.id),
    tryoutSessionQuestionId: int('tryout_session_question_id', {
      unsigned: true,
    })
      .notNull()
      .references(() => tryoutSessionQuestions.id),
    questionType: mysqlEnum('question_type', questionTypeValues).notNull(),
    selectedOptionKeys: json('selected_option_keys').$type<SelectedOptionKeys>(),
    answerText: longtext('answer_text'),
    isMarkedForReview: boolean('is_marked_for_review')
      .default(false)
      .notNull(),
    isCorrect: boolean('is_correct'),
    score: scoreColumn('score'),
    maxScore: scoreColumn('max_score'),
    gradingStatus: answerGradingStatusEnum.notNull(),
    gradingSource: gradingSourceEnum,
    gradingFeedback: text('grading_feedback'),
    gradedAt: timestamp('graded_at', { mode: 'date' }),
    answeredAt: timestamp('answered_at', { mode: 'date' }),
    lastSavedAt: timestamp('last_saved_at', { mode: 'date' }),
    ...auditColumns(),
  },
  (table) => [
    uniqueIndex('tryout_answers_session_question_uq').on(
      table.tryoutSessionQuestionId,
    ),
    index('tryout_answers_section_grading_idx').on(
      table.tryoutSectionSessionId,
      table.gradingStatus,
      table.gradedAt,
    ),
    index('tryout_answers_session_grading_idx').on(
      table.tryoutSessionId,
      table.gradingStatus,
      table.updatedAt,
    ),
  ],
);

export const subscriptions = mysqlTable(
  'subscriptions',
  {
    id: int('id', { unsigned: true }).autoincrement().primaryKey(),
    userId: int('user_id', { unsigned: true })
      .notNull()
      .references(() => users.id),
    planCode: planCodeEnum.notNull(),
    status: subscriptionStatusEnum.notNull(),
    source: subscriptionSourceEnum.notNull(),
    startsAt: timestamp('starts_at', { mode: 'date' }).notNull(),
    endsAt: timestamp('ends_at', { mode: 'date' }).notNull(),
    activatedByAdminId: int('activated_by_admin_id', { unsigned: true }).references(
      () => users.id,
    ),
    cancelledByAdminId: int('cancelled_by_admin_id', {
      unsigned: true,
    }).references(() => users.id),
    cancelledAt: timestamp('cancelled_at', { mode: 'date' }),
    cancellationReason: text('cancellation_reason'),
    ...auditColumns(),
  },
  (table) => [
    index('subscriptions_user_status_ends_at_idx').on(
      table.userId,
      table.status,
      table.endsAt,
    ),
    index('subscriptions_status_ends_at_idx').on(table.status, table.endsAt),
    index('subscriptions_plan_status_idx').on(table.planCode, table.status),
  ],
);

export const payments = mysqlTable(
  'payments',
  {
    id: int('id', { unsigned: true }).autoincrement().primaryKey(),
    userId: int('user_id', { unsigned: true })
      .notNull()
      .references(() => users.id),
    subscriptionId: int('subscription_id', { unsigned: true }).references(
      () => subscriptions.id,
    ),
    planCode: planCodeEnum.notNull(),
    amount: bigint('amount', { mode: 'number', unsigned: true }).notNull(),
    status: paymentStatusEnum.notNull(),
    gateway: paymentGatewayEnum.notNull(),
    paymentMethod: paymentMethodEnum,
    transactionSource: transactionSourceEnum.notNull(),
    gatewayOrderId: varchar('gateway_order_id', { length: 191 }),
    gatewayTransactionId: varchar('gateway_transaction_id', { length: 191 }),
    paymentUrl: varchar('payment_url', { length: 2048 }),
    paidAt: timestamp('paid_at', { mode: 'date' }),
    expiredAt: timestamp('expired_at', { mode: 'date' }),
    proofUrl: varchar('proof_url', { length: 2048 }),
    notes: text('notes'),
    rawPayload: json('raw_payload').$type<JsonObject>(),
    ...auditColumns(),
  },
  (table) => [
    uniqueIndex('payments_subscription_id_uq').on(table.subscriptionId),
    uniqueIndex('payments_gateway_order_id_uq').on(table.gatewayOrderId),
    uniqueIndex('payments_gateway_transaction_id_uq').on(
      table.gatewayTransactionId,
    ),
    index('payments_user_status_idx').on(
      table.userId,
      table.status,
      table.createdAt,
    ),
    index('payments_status_gateway_idx').on(
      table.status,
      table.gateway,
      table.createdAt,
    ),
  ],
);

export const monthlyUsage = mysqlTable(
  'monthly_usage',
  {
    id: int('id', { unsigned: true }).autoincrement().primaryKey(),
    userId: int('user_id', { unsigned: true })
      .notNull()
      .references(() => users.id),
    period: date('period', { mode: 'string' }).notNull(),
    practiceSessionsCount: int('practice_sessions_count', {
      unsigned: true,
    })
      .default(0)
      .notNull(),
    quizSessionsCount: int('quiz_sessions_count', { unsigned: true })
      .default(0)
      .notNull(),
    tryoutSessionsCount: int('tryout_sessions_count', { unsigned: true })
      .default(0)
      .notNull(),
    ...auditColumns(),
  },
  (table) => [
    uniqueIndex('monthly_usage_user_period_uq').on(table.userId, table.period),
    index('monthly_usage_period_idx').on(table.period),
  ],
);

export const userProgressSnapshots = mysqlTable(
  'user_progress_snapshots',
  {
    id: int('id', { unsigned: true }).autoincrement().primaryKey(),
    userId: int('user_id', { unsigned: true })
      .notNull()
      .references(() => users.id),
    examTypeId: int('exam_type_id').notNull(),
    subjectId: int('subject_id').notNull(),
    totalQuestionsAnswered: int('total_questions_answered', {
      unsigned: true,
    })
      .default(0)
      .notNull(),
    totalCorrect: int('total_correct', { unsigned: true }).default(0).notNull(),
    totalWrong: int('total_wrong', { unsigned: true }).default(0).notNull(),
    totalMaxScoreAggregate: scoreColumn('total_max_score_aggregate')
      .default('0.00')
      .notNull(),
    totalScoreAggregate: scoreColumn('total_score_aggregate')
      .default('0.00')
      .notNull(),
    averageScore: decimal('average_score', { precision: 7, scale: 2 }),
    strongestTopics: json('strongest_topics').$type<TopicAccuracySnapshot[]>(),
    weakestTopics: json('weakest_topics').$type<TopicAccuracySnapshot[]>(),
    snapshotDate: date('snapshot_date', { mode: 'string' }).notNull(),
    ...auditColumns(),
  },
  (table) => [
    uniqueIndex('user_progress_snapshots_scope_uq').on(
      table.userId,
      table.examTypeId,
      table.subjectId,
    ),
    index('user_progress_snapshots_user_exam_idx').on(
      table.userId,
      table.examTypeId,
      table.subjectId,
    ),
    index('user_progress_snapshots_user_snapshot_date_idx').on(
      table.userId,
      table.snapshotDate,
    ),
  ],
);

export const blogCategories = mysqlTable(
  'blog_categories',
  {
    id: int('id', { unsigned: true }).autoincrement().primaryKey(),
    name: varchar('name', { length: 150 }).notNull(),
    slug: varchar('slug', { length: 191 }).notNull(),
    description: text('description'),
    ...auditColumns(),
  },
  (table) => [uniqueIndex('blog_categories_slug_uq').on(table.slug)],
);

export const blogPosts = mysqlTable(
  'blog_posts',
  {
    id: int('id', { unsigned: true }).autoincrement().primaryKey(),
    categoryId: int('category_id', { unsigned: true }).references(
      () => blogCategories.id,
    ),
    authorId: int('author_id', { unsigned: true }).references(() => users.id),
    title: varchar('title', { length: 255 }).notNull(),
    slug: varchar('slug', { length: 191 }).notNull(),
    excerpt: text('excerpt'),
    content: longtext('content').notNull(),
    thumbnailUrl: varchar('thumbnail_url', { length: 2048 }),
    thumbnailCaption: varchar('thumbnail_caption', { length: 255 }),
    tags: json('tags').$type<string[]>(),
    status: contentStatusEnum.notNull(),
    seoTitle: varchar('seo_title', { length: 255 }),
    metaDescription: text('meta_description'),
    readTimeMinutes: int('read_time_minutes', { unsigned: true }),
    viewCount: int('view_count', { unsigned: true }).default(0).notNull(),
    publishedAt: timestamp('published_at', { mode: 'date' }),
    ...auditColumns(),
  },
  (table) => [
    uniqueIndex('blog_posts_slug_uq').on(table.slug),
    index('blog_posts_public_listing_idx').on(table.status, table.publishedAt),
    index('blog_posts_category_listing_idx').on(
      table.categoryId,
      table.status,
      table.publishedAt,
    ),
    index('blog_posts_author_listing_idx').on(
      table.authorId,
      table.status,
      table.createdAt,
    ),
  ],
);

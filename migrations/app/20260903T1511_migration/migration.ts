#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/04220cb1556084137ddf8596a6d4629cdd008f0193c5ccdbf49ad93f97ba9df3/contract';
import startContract from '../../snapshots/04220cb1556084137ddf8596a6d4629cdd008f0193c5ccdbf49ad93f97ba9df3/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/0925c4f3e65ea248aac341ac896f52a1868b3d9bed7331e1de4f4a34a8dc7ab8/contract';
import endContract from '../../snapshots/0925c4f3e65ea248aac341ac896f52a1868b3d9bed7331e1de4f4a34a8dc7ab8/contract.json' with { type: 'json' };
import {
  Migration,
  MigrationCLI,
  checkExpression,
  col,
  fn,
  lit,
  placeholder,
  primaryKey,
} from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.dropConstraint({ schema: 'public', table: 'grade', constraint: 'grade_name_year_key' }),
      this.dropColumn({ schema: 'public', table: 'grade', column: 'year' }),
      this.createTable({
        schema: 'public',
        table: 'academicYear',
        columns: [
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
          col('gradeId', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('name', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('year', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'answer',
        columns: [
          col('id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('isCorrect', 'bool', {
            notNull: true,
            default: lit(false),
            codecRef: { codecId: 'pg/bool@1' },
          }),
          col('order', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('questionId', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('text', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'enrollment',
        columns: [
          col('completedAt', 'timestamptz', { codecRef: { codecId: 'pg/timestamptz-temporal@1' } }),
          col('courseId', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('enrolledAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
          col('id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('status', 'text', {
            notNull: true,
            default: lit('ACTIVE'),
            codecRef: { codecId: 'pg/text@1' },
          }),
          col('studentId', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression(
            'enrollment_status_check_7337ba71',
            "\"status\" IN ('ACTIVE', 'COMPLETED', 'CANCELLED')",
          ),
        ],
      }),
      this.createTable({
        schema: 'public',
        table: 'lessonAttachment',
        columns: [
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
          col('id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('key', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('lessonId', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('name', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('size', 'int4', { codecRef: { codecId: 'pg/int4@1' } }),
          col('type', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('url', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression(
            'lessonAttachment_type_check_39791b65',
            "\"type\" IN ('VIDEO', 'PDF', 'DOCUMENT', 'IMAGE', 'OTHER')",
          ),
        ],
      }),
      this.createTable({
        schema: 'public',
        table: 'lessonProgress',
        columns: [
          col('completedAt', 'timestamptz', { codecRef: { codecId: 'pg/timestamptz-temporal@1' } }),
          col('id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('lessonId', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('progress', 'int4', {
            notNull: true,
            default: lit(0),
            codecRef: { codecId: 'pg/int4@1' },
          }),
          col('status', 'text', {
            notNull: true,
            default: lit('NOT_STARTED'),
            codecRef: { codecId: 'pg/text@1' },
          }),
          col('studentId', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('updatedAt', 'timestamptz', { codecRef: { codecId: 'pg/timestamptz-temporal@1' } }),
          col('watchedSeconds', 'int4', {
            notNull: true,
            default: lit(0),
            codecRef: { codecId: 'pg/int4@1' },
          }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression(
            'lessonProgress_status_check_f11a989d',
            "\"status\" IN ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED')",
          ),
        ],
      }),
      this.createTable({
        schema: 'public',
        table: 'lessonVideo',
        columns: [
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
          col('duration', 'int4', { codecRef: { codecId: 'pg/int4@1' } }),
          col('id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('lessonId', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('provider', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('updatedAt', 'timestamptz', { codecRef: { codecId: 'pg/timestamptz-temporal@1' } }),
          col('url', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('videoKey', 'text', { codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'quiz',
        columns: [
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
          col('description', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('lessonId', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('passingScore', 'int4', { codecRef: { codecId: 'pg/int4@1' } }),
          col('timeLimit', 'int4', { codecRef: { codecId: 'pg/int4@1' } }),
          col('title', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('updatedAt', 'timestamptz', { codecRef: { codecId: 'pg/timestamptz-temporal@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'quizAnswer',
        columns: [
          col('answerId', 'uuid', { codecRef: { codecId: 'pg/uuid@1' } }),
          col('attemptId', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('isCorrect', 'bool', { codecRef: { codecId: 'pg/bool@1' } }),
          col('points', 'numeric', { codecRef: { codecId: 'pg/numeric@1' } }),
          col('questionId', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('textAnswer', 'text', { codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'quizAttempt',
        columns: [
          col('completedAt', 'timestamptz', { codecRef: { codecId: 'pg/timestamptz-temporal@1' } }),
          col('id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('percentage', 'numeric', { codecRef: { codecId: 'pg/numeric@1' } }),
          col('quizId', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('score', 'numeric', { codecRef: { codecId: 'pg/numeric@1' } }),
          col('startedAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
          col('studentId', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'quizQuestion',
        columns: [
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
          col('id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('order', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('points', 'int4', {
            notNull: true,
            default: lit(1),
            codecRef: { codecId: 'pg/int4@1' },
          }),
          col('question', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('quizId', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('type', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression(
            'quizQuestion_type_check_494bd25a',
            "\"type\" IN ('SINGLE_CHOICE', 'MULTIPLE_CHOICE', 'TRUE_FALSE', 'TEXT')",
          ),
        ],
      }),
      this.createTable({
        schema: 'public',
        table: 'subject',
        columns: [
          col('academicYearId', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
          col('description', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('name', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'teacherWalletBalance',
        columns: [
          col('balance', 'numeric', {
            notNull: true,
            default: lit('0'),
            codecRef: { codecId: 'pg/numeric@1' },
          }),
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
          col('id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('teacherId', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('updatedAt', 'timestamptz', { codecRef: { codecId: 'pg/timestamptz-temporal@1' } }),
          col('walletId', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'voucher',
        columns: [
          col('amount', 'numeric', { notNull: true, codecRef: { codecId: 'pg/numeric@1' } }),
          col('code', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
          col('expiresAt', 'timestamptz', { codecRef: { codecId: 'pg/timestamptz-temporal@1' } }),
          col('id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('redeemedAt', 'timestamptz', { codecRef: { codecId: 'pg/timestamptz-temporal@1' } }),
          col('redeemedById', 'uuid', { codecRef: { codecId: 'pg/uuid@1' } }),
          col('status', 'text', {
            notNull: true,
            default: lit('ACTIVE'),
            codecRef: { codecId: 'pg/text@1' },
          }),
          col('teacherId', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression(
            'voucher_status_check_a82772ea',
            "\"status\" IN ('ACTIVE', 'USED', 'EXPIRED', 'CANCELLED')",
          ),
        ],
      }),
      this.createTable({
        schema: 'public',
        table: 'wallet',
        columns: [
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
          col('id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('studentId', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('updatedAt', 'timestamptz', { codecRef: { codecId: 'pg/timestamptz-temporal@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'walletTransaction',
        columns: [
          col('amount', 'numeric', { notNull: true, codecRef: { codecId: 'pg/numeric@1' } }),
          col('balanceAfter', 'numeric', { notNull: true, codecRef: { codecId: 'pg/numeric@1' } }),
          col('balanceBefore', 'numeric', { notNull: true, codecRef: { codecId: 'pg/numeric@1' } }),
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
          col('description', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('teacherWalletBalanceId', 'uuid', {
            notNull: true,
            codecRef: { codecId: 'pg/uuid@1' },
          }),
          col('type', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('voucherId', 'uuid', { codecRef: { codecId: 'pg/uuid@1' } }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression(
            'walletTransaction_type_check_679a6c62',
            "\"type\" IN ('VOUCHER_RECHARGE', 'COURSE_PURCHASE', 'REFUND', 'ADJUSTMENT')",
          ),
        ],
      }),
      this.addColumn({
        schema: 'public',
        table: 'course',
        column: col('thumbnailUrl', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'courseSection',
        column: col('createdAt', 'timestamptz', {
          notNull: true,
          default: fn('now()'),
          codecRef: { codecId: 'pg/timestamptz-temporal@1' },
        }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'courseSection',
        column: col('description', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'courseSection',
        column: col('updatedAt', 'timestamptz', {
          codecRef: { codecId: 'pg/timestamptz-temporal@1' },
        }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'grade',
        column: col('description', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'grade',
        column: col('updatedAt', 'timestamptz', {
          codecRef: { codecId: 'pg/timestamptz-temporal@1' },
        }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'lesson',
        column: col('createdAt', 'timestamptz', {
          notNull: true,
          default: fn('now()'),
          codecRef: { codecId: 'pg/timestamptz-temporal@1' },
        }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'lesson',
        column: col('description', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'lesson',
        column: col('updatedAt', 'timestamptz', {
          codecRef: { codecId: 'pg/timestamptz-temporal@1' },
        }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'studentProfile',
        column: col('academicYearId', 'uuid', { codecRef: { codecId: 'pg/uuid@1' } }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'studentProfile',
        column: col('createdAt', 'timestamptz', {
          notNull: true,
          default: fn('now()'),
          codecRef: { codecId: 'pg/timestamptz-temporal@1' },
        }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'studentProfile',
        column: col('updatedAt', 'timestamptz', {
          codecRef: { codecId: 'pg/timestamptz-temporal@1' },
        }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'teacherProfile',
        column: col('createdAt', 'timestamptz', {
          notNull: true,
          default: fn('now()'),
          codecRef: { codecId: 'pg/timestamptz-temporal@1' },
        }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'teacherProfile',
        column: col('qualifications', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'teacherProfile',
        column: col('updatedAt', 'timestamptz', {
          codecRef: { codecId: 'pg/timestamptz-temporal@1' },
        }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'user',
        column: col('avatarUrl', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'user',
        column: col('phone', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'course',
        column: col('subjectId', 'uuid', { codecRef: { codecId: 'pg/uuid@1' } }),
      }),
      this.dataTransform(endContract, 'backfill-course-subjectId', {
        check: () => placeholder('backfill-course-subjectId:check'),
        run: () => placeholder('backfill-course-subjectId:run'),
      }),
      this.setNotNull({ schema: 'public', table: 'course', column: 'subjectId' }),
      this.dropNotNull({ schema: 'public', table: 'course', column: 'updatedAt' }),
      this.dropNotNull({ schema: 'public', table: 'user', column: 'updatedAt' }),
      this.addUnique({
        schema: 'public',
        table: 'academicYear',
        constraint: 'academicYear_gradeId_year_key',
        columns: ['gradeId', 'year'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'answer',
        constraint: 'answer_questionId_order_key',
        columns: ['questionId', 'order'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'enrollment',
        constraint: 'enrollment_studentId_courseId_key',
        columns: ['studentId', 'courseId'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'grade',
        constraint: 'grade_name_key',
        columns: ['name'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'lessonProgress',
        constraint: 'lessonProgress_studentId_lessonId_key',
        columns: ['studentId', 'lessonId'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'lessonVideo',
        constraint: 'lessonVideo_lessonId_key',
        columns: ['lessonId'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'quizQuestion',
        constraint: 'quizQuestion_quizId_order_key',
        columns: ['quizId', 'order'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'subject',
        constraint: 'subject_academicYearId_name_key',
        columns: ['academicYearId', 'name'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'teacherWalletBalance',
        constraint: 'teacherWalletBalance_walletId_teacherId_key',
        columns: ['walletId', 'teacherId'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'voucher',
        constraint: 'voucher_code_key',
        columns: ['code'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'wallet',
        constraint: 'wallet_studentId_key',
        columns: ['studentId'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'walletTransaction',
        constraint: 'walletTransaction_voucherId_key',
        columns: ['voucherId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'academicYear',
        index: 'academicYear_gradeId_idx_624f4a73',
        columns: ['gradeId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'answer',
        index: 'answer_questionId_idx_fdb42076',
        columns: ['questionId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'course',
        index: 'course_status_idx_e98638ab',
        columns: ['status'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'course',
        index: 'course_subjectId_idx_84df2a1d',
        columns: ['subjectId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'enrollment',
        index: 'enrollment_courseId_idx_12f72d2a',
        columns: ['courseId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'enrollment',
        index: 'enrollment_studentId_idx_bf255322',
        columns: ['studentId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'lessonAttachment',
        index: 'lessonAttachment_lessonId_idx_e358970d',
        columns: ['lessonId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'lessonProgress',
        index: 'lessonProgress_lessonId_idx_e358970d',
        columns: ['lessonId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'lessonProgress',
        index: 'lessonProgress_studentId_idx_bf255322',
        columns: ['studentId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'quiz',
        index: 'quiz_lessonId_idx_e358970d',
        columns: ['lessonId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'quizAnswer',
        index: 'quizAnswer_answerId_idx_b6b70d29',
        columns: ['answerId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'quizAnswer',
        index: 'quizAnswer_attemptId_idx_94f50eb9',
        columns: ['attemptId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'quizAnswer',
        index: 'quizAnswer_questionId_idx_fdb42076',
        columns: ['questionId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'quizAttempt',
        index: 'quizAttempt_quizId_idx_c721979c',
        columns: ['quizId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'quizAttempt',
        index: 'quizAttempt_studentId_idx_bf255322',
        columns: ['studentId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'quizQuestion',
        index: 'quizQuestion_quizId_idx_c721979c',
        columns: ['quizId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'studentProfile',
        index: 'studentProfile_academicYearId_idx_420494e0',
        columns: ['academicYearId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'subject',
        index: 'subject_academicYearId_idx_420494e0',
        columns: ['academicYearId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'teacherWalletBalance',
        index: 'teacherWalletBalance_teacherId_idx_bc266660',
        columns: ['teacherId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'teacherWalletBalance',
        index: 'teacherWalletBalance_walletId_idx_2e003173',
        columns: ['walletId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'user',
        index: 'user_role_idx_2c1ddf83',
        columns: ['role'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'voucher',
        index: 'voucher_redeemedById_idx_bd207672',
        columns: ['redeemedById'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'voucher',
        index: 'voucher_status_idx_e98638ab',
        columns: ['status'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'voucher',
        index: 'voucher_teacherId_idx_bc266660',
        columns: ['teacherId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'walletTransaction',
        index: 'walletTransaction_teacherWalletBalanceId_idx_916dc4be',
        columns: ['teacherWalletBalanceId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'walletTransaction',
        index: 'walletTransaction_type_idx_b6b604ea',
        columns: ['type'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'walletTransaction',
        index: 'walletTransaction_voucherId_idx_223de839',
        columns: ['voucherId'],
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'academicYear',
        foreignKey: {
          name: 'academicYear_gradeId_fkey',
          columns: ['gradeId'],
          references: { schema: 'public', table: 'grade', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'answer',
        foreignKey: {
          name: 'answer_questionId_fkey',
          columns: ['questionId'],
          references: { schema: 'public', table: 'quizQuestion', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'enrollment',
        foreignKey: {
          name: 'enrollment_studentId_fkey',
          columns: ['studentId'],
          references: { schema: 'public', table: 'user', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'enrollment',
        foreignKey: {
          name: 'enrollment_courseId_fkey',
          columns: ['courseId'],
          references: { schema: 'public', table: 'course', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'lessonAttachment',
        foreignKey: {
          name: 'lessonAttachment_lessonId_fkey',
          columns: ['lessonId'],
          references: { schema: 'public', table: 'lesson', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'lessonProgress',
        foreignKey: {
          name: 'lessonProgress_studentId_fkey',
          columns: ['studentId'],
          references: { schema: 'public', table: 'user', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'lessonProgress',
        foreignKey: {
          name: 'lessonProgress_lessonId_fkey',
          columns: ['lessonId'],
          references: { schema: 'public', table: 'lesson', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'lessonVideo',
        foreignKey: {
          name: 'lessonVideo_lessonId_fkey',
          columns: ['lessonId'],
          references: { schema: 'public', table: 'lesson', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'quiz',
        foreignKey: {
          name: 'quiz_lessonId_fkey',
          columns: ['lessonId'],
          references: { schema: 'public', table: 'lesson', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'quizAnswer',
        foreignKey: {
          name: 'quizAnswer_attemptId_fkey',
          columns: ['attemptId'],
          references: { schema: 'public', table: 'quizAttempt', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'quizAnswer',
        foreignKey: {
          name: 'quizAnswer_questionId_fkey',
          columns: ['questionId'],
          references: { schema: 'public', table: 'quizQuestion', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'quizAnswer',
        foreignKey: {
          name: 'quizAnswer_answerId_fkey',
          columns: ['answerId'],
          references: { schema: 'public', table: 'answer', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'quizAttempt',
        foreignKey: {
          name: 'quizAttempt_studentId_fkey',
          columns: ['studentId'],
          references: { schema: 'public', table: 'user', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'quizAttempt',
        foreignKey: {
          name: 'quizAttempt_quizId_fkey',
          columns: ['quizId'],
          references: { schema: 'public', table: 'quiz', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'quizQuestion',
        foreignKey: {
          name: 'quizQuestion_quizId_fkey',
          columns: ['quizId'],
          references: { schema: 'public', table: 'quiz', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'studentProfile',
        foreignKey: {
          name: 'studentProfile_academicYearId_fkey',
          columns: ['academicYearId'],
          references: { schema: 'public', table: 'academicYear', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'subject',
        foreignKey: {
          name: 'subject_academicYearId_fkey',
          columns: ['academicYearId'],
          references: { schema: 'public', table: 'academicYear', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'course',
        foreignKey: {
          name: 'course_subjectId_fkey',
          columns: ['subjectId'],
          references: { schema: 'public', table: 'subject', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'teacherWalletBalance',
        foreignKey: {
          name: 'teacherWalletBalance_walletId_fkey',
          columns: ['walletId'],
          references: { schema: 'public', table: 'wallet', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'teacherWalletBalance',
        foreignKey: {
          name: 'teacherWalletBalance_teacherId_fkey',
          columns: ['teacherId'],
          references: { schema: 'public', table: 'user', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'voucher',
        foreignKey: {
          name: 'voucher_teacherId_fkey',
          columns: ['teacherId'],
          references: { schema: 'public', table: 'user', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'voucher',
        foreignKey: {
          name: 'voucher_redeemedById_fkey',
          columns: ['redeemedById'],
          references: { schema: 'public', table: 'user', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'wallet',
        foreignKey: {
          name: 'wallet_studentId_fkey',
          columns: ['studentId'],
          references: { schema: 'public', table: 'user', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'walletTransaction',
        foreignKey: {
          name: 'walletTransaction_teacherWalletBalanceId_fkey',
          columns: ['teacherWalletBalanceId'],
          references: { schema: 'public', table: 'teacherWalletBalance', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'walletTransaction',
        foreignKey: {
          name: 'walletTransaction_voucherId_fkey',
          columns: ['voucherId'],
          references: { schema: 'public', table: 'voucher', columns: ['id'] },
        },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);

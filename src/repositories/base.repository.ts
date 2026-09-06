import { Collection, DefaultModelRow } from "@prisma/orm-postgres/orm-client";

import { db } from "../prisma/db";

import type { Contract } from "../prisma/contract";

/**
 * Generic base repository shared by all model repositories.
 *
 * TName must be a valid model name key on the Contract's "public" schema
 * (e.g. "User", "Course", "Enrollment", ...).
 */
export abstract class BaseRepository<TName extends string> {
  protected readonly model: ModelCollection<TName>;

  constructor(modelName: TName) {
    this.model = (db.orm.public as any)[modelName];
  }

  async findById(id: string) {
    return this.model.where((row: any) => row.id.eq(id)).first();
  }

  async findOne(where: WhereInput<TName>) {
    return this.model.where(where).first();
  }

  async findAll() {
    return this.model.all();
  }

  async findMany(where: WhereInput<TName>) {
    return this.model.where(where).all();
  }

  async count() {
    return this.model.count();
  }

  async countWhere(where: WhereInput<TName>) {
    return this.model.where(where).count();
  }

  // ============================================================
  // CREATE
  // ============================================================

  async create(data: Parameters<ModelCollection<TName>["create"]>[0]) {
    return this.model.create(data);
  }

  async createMany(data: Parameters<ModelCollection<TName>["createAll"]>[0]) {
    return this.model.createAll(data);
  }

  // ============================================================
  // UPDATE
  // ============================================================

  async update({
    where,
    update,
  }: {
    where: WhereInput<TName>;
    update: Parameters<ModelCollection<TName>["updateAll"]>[0] | any;
  }) {
    return this.model.where(where).update(update as any);
  }

  /**
   * Update a row by ID
   */
  async updateById(
    id: string,
    update: Parameters<ModelCollection<TName>["update"]>[0] | any,
  ) {
    return this.model.where((row: any) => row.id.eq(id)).update(update);
  }

  /**
   * Update all rows matching a condition
   */
  async updateMany({
    where,
    update,
  }: {
    where: WhereInput<TName>;
    update: Parameters<ModelCollection<TName>["updateAll"]>[0] | any;
  }) {
    return this.model.where(where).updateAll(update);
  }

  /**
   * Update multiple rows and return count
   */
  async updateManyCount({
    where,
    update,
  }: {
    where: WhereInput<TName>;
    update: Parameters<ModelCollection<TName>["updateAndCount"]>[0] | any;
  }) {
    return this.model.where(where).updateAndCount(update);
  }

  // ============================================================
  // DELETE
  // ============================================================

  /**
   * Delete one row
   */
  async delete(where: WhereInput<TName>) {
    return this.model.where(where).delete();
  }

  /**
   * Delete row by ID
   */
  async deleteById(id: string) {
    return this.model.where((row: any) => row.id.eq(id)).delete();
  }

  /**
   * Delete all matching rows
   */
  async deleteMany(where: WhereInput<TName>) {
    return this.model.where(where).deleteAll();
  }

  // ============================================================
  // UPSERT
  // ============================================================

  /**
   * Create a row if it doesn't exist, otherwise update it.
   */
  async upsert({
    create,
    update,
    conflictOn,
  }: {
    create: Parameters<ModelCollection<TName>["upsert"]>[0]["create"];
    update: Parameters<ModelCollection<TName>["upsert"]>[0]["update"];
    conflictOn?: Parameters<ModelCollection<TName>["upsert"]>[0]["conflictOn"];
  }) {
    return this.model.upsert({
      create,
      update,
      ...(conflictOn ? { conflictOn } : {}),
    });
  }
}

/**
 * Type alias for a model's Collection, keyed by model name.
 * Defined outside the class so parameter types can reference it directly
 * instead of `typeof this.model`, which TypeScript cannot resolve inside
 * nested parameter/object-type positions when the class is generic.
 */
type ModelCollection<TName extends string> = Collection<
  Contract,
  TName,
  DefaultModelRow<Contract, TName, "public">
>;

/**
 * Whatever `.where()` itself accepts for a given model — either a partial
 * object filter, or a predicate callback over the row proxy (e.g.
 * `(user) => user.email.eq(email) && user.EmailConfirmedAt.isNull()`).
 * Derived directly from the Collection's own `where` signature so it never
 * drifts out of sync with what the underlying ORM actually supports.
 */
type WhereInput<TName extends string> = Parameters<
  ModelCollection<TName>["where"]
>[0];

import SequelizeRepository from './sequelizeRepository';
import AuditLogRepository from './auditLogRepository';
import lodash from 'lodash';
import SequelizeFilterUtils from '../utils/sequelizeFilterUtils';
import Error404 from '../../errors/Error404';
import Sequelize from 'sequelize';
import { IRepositoryOptions } from './IRepositoryOptions';
import funeraria from '../models/funeraria';

const Op = Sequelize.Op;

class CerimoniaDataRepository {

  static async create(data, options: IRepositoryOptions) {
    const currentUser = SequelizeRepository.getCurrentUser(
      options,
    );

    const tenant = SequelizeRepository.getCurrentTenant(
      options,
    );

    console.log(tenant)
    console.log(data.tenantId )
    
    const transaction = SequelizeRepository.getTransaction(
      options,
    );

    console.log("data.funerariaId")
    console.log(data.funerariaId)

    const record = await options.database.cerimoniaData.create(
      {
        ...lodash.pick(data, [
          'nome',
          'email',
          'telefone',    
          'importHash',
        ]),
        cerimoniaId: data.cerimoniaId || null,
        tenantId:    data.tenantId    || tenant.id,
        idFunerariaId: data.funerariaId ,
        // idFuneraria: data.funerariaId ,
        createdById: currentUser.id ,
        updatedById: currentUser.id ,
      },
      {
        transaction,
      },
    );

    
  

  
    await this._createAuditLog(
      AuditLogRepository.CREATE,
      record,
      data,
      options,
    );

    return this.findById(record.id, options);
  }

  static async update(id, data, options: IRepositoryOptions) {
    const currentUser = SequelizeRepository.getCurrentUser(
      options,
    );

    const transaction = SequelizeRepository.getTransaction(
      options,
    );


    const currentTenant = SequelizeRepository.getCurrentTenant(
      options,
    );

    let record = await options.database.cerimoniaData.findOne(      
      {
        where: {
          id,
          tenantId: currentTenant.id,
        },
        transaction,
      },
    );

    if (!record) {
      throw new Error404();
    }

    record = await record.update(
      {
        ...lodash.pick(data, [
          'nome',
          'email',
          'telefone',       
          'importHash',
        ]),
        cerimoniaId: data.cerimoniaId || null,
        tenantId: currentTenant.id,
        updatedById: currentUser.id,
        createdById: currentUser.id,
      },
      {
        transaction,
      },
    );





    await this._createAuditLog(
      AuditLogRepository.UPDATE,
      record,
      data,
      options,
    );

    return this.findById(record.id, options);
  }

  static async destroy(id, options: IRepositoryOptions) {
    const transaction = SequelizeRepository.getTransaction(
      options,
    );

    const currentTenant = SequelizeRepository.getCurrentTenant(
      options,
    );

    let record = await options.database.cerimoniaData.findOne(
      {
        where: {
          id,
          tenantId: currentTenant.id,
        },
        transaction,
      },
    );

    if (!record) {
      throw new Error404();
    }

    await record.destroy({
      transaction,
    });

    await this._createAuditLog(
      AuditLogRepository.DELETE,
      record,
      record,
      options,
    );
  }

  static async findById(id, options: IRepositoryOptions) {
    const transaction = SequelizeRepository.getTransaction(
      options,
    );

    const include = [
      {
        model: options.database.cerimonia,
        as: 'cerimonia',
      },
    ];

    const currentTenant = SequelizeRepository.getCurrentTenant(
      options,
    );

    const record = await options.database.cerimoniaData.findOne(
      {
        where: {
          id,
          tenantId: currentTenant.id,
        },
        include,
        transaction,
      },
    );

    if (!record) {
      throw new Error404();
    }

    return this._fillWithRelationsAndFiles(record, options);
  }

  static async filterIdInTenant(
    id,
    options: IRepositoryOptions,
  ) {
    return lodash.get(
      await this.filterIdsInTenant([id], options),
      '[0]',
      null,
    );
  }

  static async filterIdsInTenant(
    ids,
    options: IRepositoryOptions,
  ) {
    if (!ids || !ids.length) {
      return [];
    }

    const currentTenant =
      SequelizeRepository.getCurrentTenant(options);

    const where = {
      id: {
        [Op.in]: ids,
      },
      tenantId: currentTenant.id,
    };

    const records = await options.database.cerimoniaData.findAll(
      {
        attributes: ['id'],
        where,
      },
    );

    return records.map((record) => record.id);
  }

  static async count(filter, options: IRepositoryOptions) {
    const transaction = SequelizeRepository.getTransaction(
      options,
    );

    const tenant = SequelizeRepository.getCurrentTenant(
      options,
    );

    return options.database.cerimoniaData.count(
      {
        where: {
          ...filter,
          tenantId: tenant.id,
        },
        transaction,
      },
    );
  }

  static async findAndCountAll(
    { filter, limit = 0, offset = 0, orderBy = '' },
    options: IRepositoryOptions,
  ) {
    const tenant = SequelizeRepository.getCurrentTenant(
      options,
    );

    let whereAnd: Array<any> = [];
    let include = [
      {
        model: options.database.cerimonia,
        as: 'cerimonia',
      },      
    ];

    whereAnd.push({
      tenantId: tenant.id,
    });

    if (filter) {
      if (filter.id) {
        whereAnd.push({
          ['id']: SequelizeFilterUtils.uuid(filter.id),
        });
      }

      if (filter.cerimoniaId) {
        whereAnd.push({
          ['cerimoniaId']: SequelizeFilterUtils.uuid(
            filter.cerimoniaId,
          ),
        });
      }

      if (filter.nome) {
        whereAnd.push(
          SequelizeFilterUtils.ilikeIncludes(
            'cerimoniaData',
            'nome',
            filter.nome,
          ),
        );
      }

      if (filter.cpf) {
        whereAnd.push(
          SequelizeFilterUtils.ilikeIncludes(
            'cerimoniaData',
            'cpf',
            filter.cpf,
          ),
        );
      }

      if (filter.dataCerimoniaRange) {
        const [start, end] = filter.dataCerimoniaRange;

        if (start !== undefined && start !== null && start !== '') {
          whereAnd.push({
            dataCerimonia: {
              [Op.gte]: start,
            },
          });
        }

        if (end !== undefined && end !== null && end !== '') {
          whereAnd.push({
            dataCerimonia: {
              [Op.lte]: end,
            },
          });
        }
      }

      if (filter.responsavel) {
        whereAnd.push(
          SequelizeFilterUtils.ilikeIncludes(
            'cerimoniaData',
            'responsavel',
            filter.responsavel,
          ),
        );
      }

      if (filter.telefoneResponsavel) {
        whereAnd.push(
          SequelizeFilterUtils.ilikeIncludes(
            'cerimoniaData',
            'telefoneResponsavel',
            filter.telefoneResponsavel,
          ),
        );
      }

      if (filter.emailResponsavel) {
        whereAnd.push(
          SequelizeFilterUtils.ilikeIncludes(
            'cerimoniaData',
            'emailResponsavel',
            filter.emailResponsavel,
          ),
        );
      }

      if (filter.cerimoniaDataId) {
        whereAnd.push({
          ['cerimonia']: SequelizeFilterUtils.uuid(
            filter.cerimonia,
          ),
        });
      }


      if (filter.idFuneraria) {
        whereAnd.push({
          ['idFunerariaId']: SequelizeFilterUtils.uuid(
            filter.idFuneraria,
          ),
        });
      }

      if (filter.createdAtRange) {
        const [start, end] = filter.createdAtRange;

        if (
          start !== undefined &&
          start !== null &&
          start !== ''
        ) {
          whereAnd.push({
            ['createdAt']: {
              [Op.gte]: start,
            },
          });
        }

        if (
          end !== undefined &&
          end !== null &&
          end !== ''
        ) {
          whereAnd.push({
            ['createdAt']: {
              [Op.lte]: end,
            },
          });
        }
      }
    }

    const where = { [Op.and]: whereAnd };

    let {
      rows,
      count,
    } = await options.database.cerimoniaData.findAndCountAll({
      where,
      include,
      limit: limit ? Number(limit) : undefined,
      offset: offset ? Number(offset) : undefined,
      order: orderBy
        ? [orderBy.split('_')]
        : [['createdAt', 'DESC']],
      transaction: SequelizeRepository.getTransaction(
        options,
      ),
    });

    rows = await this._fillWithRelationsAndFilesForRows(
      rows,
      options,
    );

    return { rows, count };
  }

  static async findAllAutocomplete(query, limit, options: IRepositoryOptions) {
    const tenant = SequelizeRepository.getCurrentTenant(
      options,
    );

    let whereAnd: Array<any> = [{
      tenantId: tenant.id,
    }];

    if (query) {
      whereAnd.push({
        [Op.or]: [
          { ['id']: SequelizeFilterUtils.uuid(query) },
          {
            [Op.and]: SequelizeFilterUtils.ilikeIncludes(
              'cerimoniaData',
              'nomeHomenageado',
              query,
            ),
          },
        ],
      });
    }

    const where = { [Op.and]: whereAnd };

    const records = await options.database.cerimoniaData.findAll(
      {
        attributes: ['id', 'nomeHomenageado'],
        where,
        limit: limit ? Number(limit) : undefined,
        order: [['nomeHomenageado', 'ASC']],
      },
    );

    return records.map((record) => ({
      id: record.id,
      label: record.nomeHomenageado,
    }));
  }

  static async _createAuditLog(
    action,
    record,
    data,
    options: IRepositoryOptions,
  ) {
    let values = {};

    if (data) {
      values = {
        ...record.get({ plain: true }),

      };
    }

    await AuditLogRepository.log(
      {
        entityName: 'cerimoniaData',
        entityId: record.id,
        action,
        values,
      },
      options,
    );
  }

  static async _fillWithRelationsAndFilesForRows(
    rows,
    options: IRepositoryOptions,
  ) {
    if (!rows) {
      return rows;
    }

    return Promise.all(
      rows.map((record) =>
        this._fillWithRelationsAndFiles(record, options),
      ),
    );
  }

  static async _fillWithRelationsAndFiles(record, options: IRepositoryOptions) {
    if (!record) {
      return record;
    }

    const output = record.get({ plain: true });

    const transaction = SequelizeRepository.getTransaction(
      options,
    );



    return output;
  }
}

export default CerimoniaDataRepository;

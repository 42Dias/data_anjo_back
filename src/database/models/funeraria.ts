import { DataTypes } from 'sequelize';

export default function (sequelize) {
  const funeraria = sequelize.define(
    'funeraria',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      nomeFuneraria: {
        type: DataTypes.TEXT,
      },
      importHash: {
        type: DataTypes.STRING(255),
        allowNull: true,    
        validate: {
          len: [0, 255],
        },    
      },
    },
    {
      indexes: [
        {
          unique: true,
          fields: ['importHash', 'tenantId'],
          where: {
            deletedAt: null,
          },
        },

      ],
      timestamps: true,
      paranoid: true,
    },
  );

  funeraria.associate = (models) => {
    models.funeraria.belongsToMany(models.cerimonia, {
      as: 'idCerimonia',
      constraints: false,
      through: 'funerariaIdCerimoniaCerimonia',
    });


    
    models.funeraria.belongsTo(models.tenant, {
      as: 'tenant',
      foreignKey: {
        allowNull: false,
      },
    });

    models.funeraria.belongsTo(models.user, {
      as: 'createdBy',
    });

    models.funeraria.belongsTo(models.user, {
      as: 'updatedBy',
    });
  };

  return funeraria;
}

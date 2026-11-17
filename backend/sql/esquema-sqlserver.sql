-- Esquema de ReportaCampus para SQL Server
-- Generado con: python -m app.esquema

CREATE TABLE auditoria (
	id INTEGER NOT NULL IDENTITY,
	fecha DATETIME2 NOT NULL,
	usuario_id INTEGER NULL,
	usuario_nombre NVARCHAR(60) NOT NULL,
	accion VARCHAR(40) NOT NULL,
	entidad VARCHAR(20) NOT NULL,
	entidad_id VARCHAR(20) NOT NULL,
	detalle NVARCHAR(300) NOT NULL,
	PRIMARY KEY (id)
);

CREATE INDEX ix_auditoria_fecha ON auditoria (fecha);

CREATE TABLE categorias (
	id VARCHAR(20) NOT NULL,
	nombre NVARCHAR(40) NOT NULL,
	PRIMARY KEY (id)
);

CREATE TABLE usuarios (
	id INTEGER NOT NULL IDENTITY,
	nombre NVARCHAR(60) NOT NULL,
	correo VARCHAR(80) NOT NULL,
	clave_hash VARCHAR(255) NOT NULL,
	rol VARCHAR(15) NOT NULL,
	area NVARCHAR(40) NOT NULL,
	activo BIT NOT NULL,
	creado DATETIME2 NOT NULL,
	PRIMARY KEY (id),
	CONSTRAINT ck_usuarios_rol CHECK (rol IN ('estudiante','responsable','administrador')),
	UNIQUE (correo)
);

CREATE TABLE zonas (
	id VARCHAR(20) NOT NULL,
	nombre NVARCHAR(40) NOT NULL,
	detalle NVARCHAR(60) NOT NULL,
	PRIMARY KEY (id)
);

CREATE TABLE reportes (
	id INTEGER NOT NULL IDENTITY,
	titulo NVARCHAR(80) NOT NULL,
	descripcion NVARCHAR(500) NOT NULL,
	categoria_id VARCHAR(20) NOT NULL,
	zona_id VARCHAR(20) NOT NULL,
	prioridad VARCHAR(5) NOT NULL,
	estado VARCHAR(10) NOT NULL,
	autor_id INTEGER NULL,
	autor_nombre NVARCHAR(60) NOT NULL,
	responsable_id INTEGER NULL,
	responsable_nombre NVARCHAR(110) NULL,
	foto_archivo VARCHAR(200) NULL,
	foto_simulada BIT NOT NULL,
	calificacion INTEGER NULL,
	calificacion_comentario NVARCHAR(300) NULL,
	creado DATETIME2 NOT NULL,
	resuelto DATETIME2 NULL,
	PRIMARY KEY (id),
	CONSTRAINT ck_reportes_estado CHECK (estado IN ('Nuevo','En proceso','Resuelto')),
	CONSTRAINT ck_reportes_prioridad CHECK (prioridad IN ('Baja','Media','Alta')),
	CONSTRAINT ck_reportes_calificacion CHECK (calificacion IS NULL OR (calificacion BETWEEN 1 AND 5)),
	FOREIGN KEY(categoria_id) REFERENCES categorias (id),
	FOREIGN KEY(zona_id) REFERENCES zonas (id),
	FOREIGN KEY(autor_id) REFERENCES usuarios (id) ON DELETE SET NULL,
	FOREIGN KEY(responsable_id) REFERENCES usuarios (id) ON DELETE NO ACTION
);

CREATE INDEX ix_reportes_autor ON reportes (autor_id);

CREATE INDEX ix_reportes_estado ON reportes (estado);

CREATE INDEX ix_reportes_responsable ON reportes (responsable_id, estado);

CREATE TABLE responsable_categorias (
	usuario_id INTEGER NOT NULL,
	categoria_id VARCHAR(20) NOT NULL,
	PRIMARY KEY (usuario_id, categoria_id),
	FOREIGN KEY(usuario_id) REFERENCES usuarios (id) ON DELETE CASCADE,
	FOREIGN KEY(categoria_id) REFERENCES categorias (id)
);

CREATE TABLE historial (
	id INTEGER NOT NULL IDENTITY,
	reporte_id INTEGER NOT NULL,
	estado VARCHAR(10) NOT NULL,
	nota NVARCHAR(300) NOT NULL,
	por_nombre NVARCHAR(60) NOT NULL,
	usuario_id INTEGER NULL,
	fecha DATETIME2 NOT NULL,
	PRIMARY KEY (id),
	FOREIGN KEY(reporte_id) REFERENCES reportes (id) ON DELETE CASCADE
);

CREATE INDEX ix_historial_reporte_id ON historial (reporte_id);

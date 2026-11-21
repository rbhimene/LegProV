import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FaEdit, FaFolderOpen, FaTrash } from 'react-icons/fa';
import { buttonClasses } from '../ui/Button';

/** One project: name, description, diagram count, last update, actions. */
const ProjectCard = ({ project, onEdit, onDelete }) => {
  const { t, i18n } = useTranslation();
  const date = new Date(project.updated_at).toLocaleDateString(i18n.language);
  const iconButton = 'rounded-lg p-2 text-muted transition hover:bg-bg';

  return (
    <article className="flex flex-col rounded-2xl border border-border bg-surface p-5 shadow-sm transition hover:shadow-md">
      <div className="flex items-start justify-between gap-2">
        <h3 className="break-words text-lg font-semibold">{project.name}</h3>
        <div className="flex shrink-0">
          <button type="button" onClick={() => onEdit(project)} aria-label={t('common.edit')}
            className={`${iconButton} hover:text-primary`}>
            <FaEdit />
          </button>
          <button type="button" onClick={() => onDelete(project)} aria-label={t('common.delete')}
            className={`${iconButton} hover:text-danger`}>
            <FaTrash />
          </button>
        </div>
      </div>

      <p className="mt-2 line-clamp-3 flex-1 text-sm text-muted">{project.description}</p>

      <div className="mt-4 flex items-center justify-between text-xs text-muted">
        <span className="rounded-full bg-bg px-2.5 py-1 font-medium">
          {t('projects.diagramsCount', { count: project.num_diagrams })}
        </span>
        <span>{t('projects.updatedOn', { date })}</span>
      </div>

      <Link to={`/dashboard/project/${project.id}`} className={`${buttonClasses('secondary')} mt-4`}>
        <FaFolderOpen aria-hidden="true" /> {t('common.open')}
      </Link>
    </article>
  );
};

export default ProjectCard;
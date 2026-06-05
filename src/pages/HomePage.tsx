import { Link } from 'react-router-dom';
import { useTranslation } from '../i18n/useTranslation';
import { listTasks } from '../tasks/registry';

export function HomePage() {
  const { t } = useTranslation();
  const tasks = listTasks();

  return (
    <section className="page" aria-labelledby="home-title">
      <h1 id="home-title">{t('home.title')}</h1>
      <p className="lede">{t('home.lede')}</p>

      <h2>{t('home.tasksHeading')}</h2>
      {tasks.length === 0 ? (
        <p className="muted">{t('home.tasksEmpty')}</p>
      ) : (
        <ul className="task-list">
          {tasks.map((task) => (
            <li className="task-list__item" key={task.slug}>
              <Link className="task-list__link" to={`/tasks/${task.slug}`}>
                {task.title}
              </Link>
              <p className="task-list__desc muted">{task.description}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

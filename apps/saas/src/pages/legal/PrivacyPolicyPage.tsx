import { Link } from 'react-router-dom';
import { useLocale } from '../../services/i18n';
import styles from './Legal.module.css';

const Ph = ({ children }: { children: string }) => (
  <span className={styles.placeholder}>{children}</span>
);

export default function PrivacyPolicyPage() {
  const { t } = useLocale();
  return (
    <div className={styles.wrap}>
      <div className={styles.container}>
        <Link to="/" className={styles.back}>← {t('legal.back_home')}</Link>
        <h1 className={styles.title}>{t('legal.privacy.title')}</h1>
        <p className={styles.updated}>{t('legal.offer.updated_label')} <Ph>{t('legal.ph.date')}</Ph></p>

        <p>{t('legal.privacy.intro')}</p>

        <h2>{t('legal.privacy.h2_1')}</h2>
        <p>
          {t('legal.privacy.operator_1')}{' '}
          <Ph>{t('legal.ph.org_name')}</Ph>{t('legal.privacy.operator_2')} <Ph>{t('legal.ph.number')}</Ph>,
          {t('legal.privacy.operator_3')} <Ph>{t('legal.ph.number')}</Ph>{t('legal.privacy.operator_4')} <Ph>{t('legal.ph.legal_address')}</Ph>
          {' '}{t('legal.privacy.operator_5')}{' '}
          <Ph>{t('legal.ph.rkn_number')}</Ph>.
        </p>
        <p>
          {t('legal.privacy.contact_1')} <Ph>{t('legal.ph.email')}</Ph>,{' '}
          <Ph>{t('legal.ph.phone')}</Ph>.
        </p>

        <h2>{t('legal.privacy.h2_2')}</h2>
        <p>{t('legal.privacy.data_intro')}</p>
        <ul>
          <li>
            <b>{t('legal.privacy.data_clients_label')}</b> {t('legal.privacy.data_clients_text')}
          </li>
          <li>
            <b>{t('legal.privacy.data_staff_label')}</b> {t('legal.privacy.data_staff_text')}
          </li>
          <li>
            <b>{t('legal.privacy.data_tech_label')}</b> {t('legal.privacy.data_tech_text')}
          </li>
        </ul>

        <h2>{t('legal.privacy.h2_3')}</h2>
        <ul>
          <li>{t('legal.privacy.purpose_1')}</li>
          <li>{t('legal.privacy.purpose_2')}</li>
          <li>{t('legal.privacy.purpose_3')}</li>
          <li>{t('legal.privacy.purpose_4')}</li>
          <li>{t('legal.privacy.purpose_5')}</li>
          <li>{t('legal.privacy.purpose_6')}</li>
          <li>{t('legal.privacy.purpose_7')}</li>
        </ul>

        <h2>{t('legal.privacy.h2_4')}</h2>
        <p>{t('legal.privacy.legal_basis')}</p>

        <h2>{t('legal.privacy.h2_5')}</h2>
        <p>{t('legal.privacy.storage_location')}</p>

        <h2>{t('legal.privacy.h2_6')}</h2>
        <p>{t('legal.privacy.transfer_intro')}</p>
        <ul>
          <li>
            {t('legal.privacy.transfer_1')}
          </li>
          <li>
            {t('legal.privacy.transfer_2')}
          </li>
          <li>
            {t('legal.privacy.transfer_3')}
          </li>
          <li>
            {t('legal.privacy.transfer_4')}
          </li>
        </ul>
        <p>
          <b>{t('legal.privacy.transfer_note_label')}</b> {t('legal.privacy.transfer_note_text')}
        </p>

        <h2>{t('legal.privacy.h2_7')}</h2>
        <p>{t('legal.privacy.retention')}</p>

        <h2>{t('legal.privacy.h2_8')}</h2>
        <p>{t('legal.privacy.rights_intro')}</p>
        <ul>
          <li>{t('legal.privacy.right_1')}</li>
          <li>{t('legal.privacy.right_2')}</li>
          <li>{t('legal.privacy.right_3')}</li>
          <li>{t('legal.privacy.right_4')}</li>
        </ul>
        <p>
          {t('legal.privacy.rights_request')} <Ph>{t('legal.ph.email')}</Ph>.
        </p>

        <h2>{t('legal.privacy.h2_9')}</h2>
        <p>{t('legal.privacy.cookies')}</p>

        <h2>{t('legal.privacy.h2_10')}</h2>
        <p>
          {t('legal.privacy.changes_1')} <Ph>motor-app.ru/privacy</Ph>.
        </p>
      </div>
    </div>
  );
}

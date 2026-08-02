import { Link } from 'react-router-dom';
import { useLocale } from '../../services/i18n';
import styles from './Legal.module.css';

const Ph = ({ children }: { children: string }) => (
  <span className={styles.placeholder}>{children}</span>
);

export default function OfferPage() {
  const { t } = useLocale();
  return (
    <div className={styles.wrap}>
      <div className={styles.container}>
        <Link to="/" className={styles.back}>← {t('legal.back_home')}</Link>
        <h1 className={styles.title}>{t('legal.offer.title')}</h1>
        <p className={styles.updated}>{t('legal.offer.updated_label')} <Ph>{t('legal.ph.date')}</Ph></p>

        <p>
          {t('legal.offer.intro_1')}{' '}
          <Ph>{t('legal.ph.org_name')}</Ph>{t('legal.offer.intro_2')} <Ph>{t('legal.ph.number')}</Ph>
          {t('legal.offer.intro_3')} <Ph>{t('legal.ph.number')}</Ph>{' '}
          {t('legal.offer.intro_4')}
        </p>

        <h2>{t('legal.offer.h2_1')}</h2>
        <p>{t('legal.offer.p_subject')}</p>

        <h2>{t('legal.offer.h2_2')}</h2>
        <ul>
          <li>{t('legal.offer.tariff_1')}</li>
          <li>{t('legal.offer.tariff_2')}</li>
          <li>{t('legal.offer.tariff_3_1')} <Ph>{t('legal.ph.days')}</Ph> {t('legal.offer.tariff_3_2')}</li>
          <li>{t('legal.offer.tariff_4_1')} <Ph>{t('legal.ph.days')}</Ph> {t('legal.offer.tariff_4_2')}</li>
        </ul>

        <h2>{t('legal.offer.h2_3')}</h2>
        <ul>
          <li>{t('legal.offer.exec_1')}</li>
          <li>{t('legal.offer.exec_2')}</li>
          <li>{t('legal.offer.exec_3')}</li>
          <li>{t('legal.offer.exec_4')}</li>
        </ul>

        <h2>{t('legal.offer.h2_4')}</h2>
        <ul>
          <li>{t('legal.offer.client_1')}</li>
          <li>{t('legal.offer.client_2')}</li>
          <li>{t('legal.offer.client_3')}</li>
          <li>{t('legal.offer.client_4')}</li>
        </ul>

        <h2>{t('legal.offer.h2_5')}</h2>
        <p>{t('legal.offer.liability')}</p>

        <h2>{t('legal.offer.h2_6')}</h2>
        <p>{t('legal.offer.term')}</p>

        <h2>{t('legal.offer.h2_7')}</h2>
        <p>
          {t('legal.offer.pd_1')}{' '}
          <Link to="/privacy">{t('legal.offer.pd_link')}</Link>.
        </p>

        <h2>{t('legal.offer.h2_8')}</h2>
        <p>
          {t('legal.offer.disputes_1')} <Ph>{t('legal.ph.days')}</Ph> {t('legal.offer.disputes_2')}
        </p>

        <h2>{t('legal.offer.h2_9')}</h2>
        <p>
          <Ph>{t('legal.ph.name_only')}</Ph><br />
          {t('legal.offer.requisites_ogrn')} <Ph>{t('legal.ph.number')}</Ph><br />
          {t('legal.offer.requisites_inn')} <Ph>{t('legal.ph.number')}</Ph><br />
          {t('legal.offer.requisites_address')} <Ph>{t('legal.ph.address')}</Ph><br />
          {t('legal.offer.requisites_account')} <Ph>{t('legal.ph.bank_details')}</Ph><br />
          {t('legal.offer.requisites_contacts')} <Ph>{t('legal.ph.email_phone')}</Ph>
        </p>
      </div>
    </div>
  );
}

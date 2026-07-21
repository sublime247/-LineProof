use soroban_sdk::{testutils::Address as _, Address, Env, Symbol};

use crate::{AdvancementRule, PositionStatus, QueueConfig, QueueImpl, QueueImplClient, QueueStatus};

fn make_config(env: &Env, admin: &Address) -> QueueConfig {
    QueueConfig {
        slug: Symbol::new(env, "sneaker_drop"),
        name: Symbol::new(env, "SneakerDrop"),
        admin: admin.clone(),
        max_positions: 5,
        enrollment_open: 1_000,
        enrollment_close: 2_000,
        status: QueueStatus::Draft,
        version: 1,
        advancement_rule: AdvancementRule::Fifo,
    }
}

#[test]
fn test_initialize_persists_config() {
    let env = Env::default();
    let admin = Address::generate(&env);
    let contract_id = env.register(QueueImpl, ());
    env.mock_all_auths();
    let client = QueueImplClient::new(&env, &contract_id);
    let config = make_config(&env, &admin);
    client.initialize(&admin, &config);
    let loaded = client.get_config();
    assert_eq!(loaded.max_positions, 5);
    assert_eq!(loaded.version, 1);
}

#[test]
fn test_open_enrollment() {
    let env = Env::default();
    let admin = Address::generate(&env);
    let contract_id = env.register(QueueImpl, ());
    env.mock_all_auths();
    let client = QueueImplClient::new(&env, &contract_id);
    let config = make_config(&env, &admin);
    client.initialize(&admin, &config);
    client.open_enrollment(&admin);
    let loaded = client.get_config();
    assert!(matches!(loaded.status, QueueStatus::EnrollmentOpen));
}

#[test]
fn test_close_enrollment() {
    let env = Env::default();
    let admin = Address::generate(&env);
    let contract_id = env.register(QueueImpl, ());
    env.mock_all_auths();
    let client = QueueImplClient::new(&env, &contract_id);
    let config = make_config(&env, &admin);
    client.initialize(&admin, &config);
    client.open_enrollment(&admin);
    client.close_enrollment(&admin);
    let loaded = client.get_config();
    assert!(matches!(loaded.status, QueueStatus::EnrollmentClosed));
}

#[test]
fn test_advance_updates_positions() {
    let env = Env::default();
    let admin = Address::generate(&env);
    let contract_id = env.register(QueueImpl, ());
    env.mock_all_auths();
    let client = QueueImplClient::new(&env, &contract_id);
    let config = make_config(&env, &admin);
    client.initialize(&admin, &config);
    client.open_enrollment(&admin);

    let user1 = Address::generate(&env);
    let user2 = Address::generate(&env);
    client.enroll_position(&user1);
    client.enroll_position(&user2);

    client.close_enrollment(&admin);

    let advanced = client.advance(&admin, &2);
    assert_eq!(advanced.len(), 2);

    let loaded1 = client.get_position(&1).unwrap();
    assert!(matches!(loaded1.status, PositionStatus::Advanced));
    assert!(loaded1.advanced_at.is_some());

    let loaded2 = client.get_position(&2).unwrap();
    assert!(matches!(loaded2.status, PositionStatus::Advanced));
}

#[test]
#[should_panic(expected = "queue not initialized")]
fn test_get_config_panics_when_missing() {
    let env = Env::default();
    let _admin = Address::generate(&env);
    let contract_id = env.register(QueueImpl, ());
    env.mock_all_auths();
    let client = QueueImplClient::new(&env, &contract_id);
    let _ = client.get_config();
}

#[test]
fn test_current_position_index() {
    let env = Env::default();
    let admin = Address::generate(&env);
    let contract_id = env.register(QueueImpl, ());
    env.mock_all_auths();
    let client = QueueImplClient::new(&env, &contract_id);
    let config = make_config(&env, &admin);
    client.initialize(&admin, &config);
    assert_eq!(client.current_position_index(), 0);
    assert_eq!(client.current_position_index(), 0);
}

#[test]
fn test_enroll_position_creates_pending() {
    let env = Env::default();
    let admin = Address::generate(&env);
    let contract_id = env.register(QueueImpl, ());
    env.mock_all_auths();
    let client = QueueImplClient::new(&env, &contract_id);
    let config = make_config(&env, &admin);
    client.initialize(&admin, &config);
    client.open_enrollment(&admin);

    let user = Address::generate(&env);
    let pos_id = client.enroll_position(&user);
    assert_eq!(pos_id, 1);

    let loaded = client.get_position(&pos_id).unwrap();
    assert_eq!(loaded.identity, user);
    assert!(matches!(loaded.status, PositionStatus::Pending));
}

#[test]
#[should_panic(expected = "enrollment is not open")]
fn test_enroll_position_rejects_when_not_open() {
    let env = Env::default();
    let admin = Address::generate(&env);
    let contract_id = env.register(QueueImpl, ());
    env.mock_all_auths();
    let client = QueueImplClient::new(&env, &contract_id);
    let config = make_config(&env, &admin);
    client.initialize(&admin, &config);
    let user = Address::generate(&env);
    client.enroll_position(&user);
}

#[test]
fn test_cancel_position() {
    let env = Env::default();
    let admin = Address::generate(&env);
    let contract_id = env.register(QueueImpl, ());
    env.mock_all_auths();
    let client = QueueImplClient::new(&env, &contract_id);
    let config = make_config(&env, &admin);
    client.initialize(&admin, &config);
    client.open_enrollment(&admin);

    let user = Address::generate(&env);
    let pos_id = client.enroll_position(&user);
    client.cancel_position(&user, &pos_id);

    let loaded = client.get_position(&pos_id).unwrap();
    assert!(matches!(loaded.status, PositionStatus::Cancelled));
}

#[test]
#[should_panic(expected = "not your position")]
fn test_cancel_position_wrong_identity() {
    let env = Env::default();
    let admin = Address::generate(&env);
    let contract_id = env.register(QueueImpl, ());
    env.mock_all_auths();
    let client = QueueImplClient::new(&env, &contract_id);
    let config = make_config(&env, &admin);
    client.initialize(&admin, &config);
    client.open_enrollment(&admin);

    let user = Address::generate(&env);
    let other = Address::generate(&env);
    let pos_id = client.enroll_position(&user);
    client.cancel_position(&other, &pos_id);
}

#[test]
fn test_total_enrolled() {
    let env = Env::default();
    let admin = Address::generate(&env);
    let contract_id = env.register(QueueImpl, ());
    env.mock_all_auths();
    let client = QueueImplClient::new(&env, &contract_id);
    let config = make_config(&env, &admin);
    client.initialize(&admin, &config);
    client.open_enrollment(&admin);

    assert_eq!(client.total_enrolled(), 0);
    let u1 = Address::generate(&env);
    let u2 = Address::generate(&env);
    client.enroll_position(&u1);
    client.enroll_position(&u2);
    assert_eq!(client.total_enrolled(), 2);
}

#[test]
fn test_close() {
    let env = Env::default();
    let admin = Address::generate(&env);
    let contract_id = env.register(QueueImpl, ());
    env.mock_all_auths();
    let client = QueueImplClient::new(&env, &contract_id);
    let config = make_config(&env, &admin);
    client.initialize(&admin, &config);
    client.close(&admin);
    let loaded = client.get_config();
    assert!(matches!(loaded.status, QueueStatus::Closed));
}

#[test]
#[should_panic(expected = "enrollment must be closed before advancing")]
fn test_advance_requires_enrollment_closed() {
    let env = Env::default();
    let admin = Address::generate(&env);
    let contract_id = env.register(QueueImpl, ());
    env.mock_all_auths();
    let client = QueueImplClient::new(&env, &contract_id);
    let config = make_config(&env, &admin);
    client.initialize(&admin, &config);
    client.open_enrollment(&admin);
    client.advance(&admin, &1);
}

#[test]
fn test_advance_stays_in_advancement_active() {
    let env = Env::default();
    let admin = Address::generate(&env);
    let contract_id = env.register(QueueImpl, ());
    env.mock_all_auths();
    let client = QueueImplClient::new(&env, &contract_id);
    let config = make_config(&env, &admin);
    client.initialize(&admin, &config);
    client.open_enrollment(&admin);

    let user = Address::generate(&env);
    client.enroll_position(&user);

    client.close_enrollment(&admin);
    client.advance(&admin, &1);
    let cfg = client.get_config();
    assert!(matches!(cfg.status, QueueStatus::AdvancementActive));
}

#[test]
fn test_get_position_by_id() {
    let env = Env::default();
    let admin = Address::generate(&env);
    let contract_id = env.register(QueueImpl, ());
    env.mock_all_auths();
    let client = QueueImplClient::new(&env, &contract_id);
    let config = make_config(&env, &admin);
    client.initialize(&admin, &config);
    client.open_enrollment(&admin);

    let user = Address::generate(&env);
    client.enroll_position(&user);

    let loaded = client.get_position(&1).unwrap();
    assert_eq!(loaded.identity, user);
}

#[test]
#[should_panic(expected = "queue is closed")]
fn test_advance_closed_queue_panics() {
    let env = Env::default();
    let admin = Address::generate(&env);
    let contract_id = env.register(QueueImpl, ());
    env.mock_all_auths();
    let client = QueueImplClient::new(&env, &contract_id);
    let config = make_config(&env, &admin);
    client.initialize(&admin, &config);
    client.open_enrollment(&admin);
    client.close_enrollment(&admin);
    client.close(&admin);
    client.advance(&admin, &1);
}

#[test]
#[should_panic(expected = "queue is closed")]
fn test_open_enrollment_after_close_panics() {
    let env = Env::default();
    let admin = Address::generate(&env);
    let contract_id = env.register(QueueImpl, ());
    env.mock_all_auths();
    let client = QueueImplClient::new(&env, &contract_id);
    let config = make_config(&env, &admin);
    client.initialize(&admin, &config);
    client.close(&admin);
    client.open_enrollment(&admin);
}

#[test]
fn test_advance_empty_queue_returns_empty_vec() {
    let env = Env::default();
    let admin = Address::generate(&env);
    let contract_id = env.register(QueueImpl, ());
    env.mock_all_auths();
    let client = QueueImplClient::new(&env, &contract_id);
    let config = make_config(&env, &admin);
    client.initialize(&admin, &config);
    client.open_enrollment(&admin);
    client.close_enrollment(&admin);

    let result = client.advance(&admin, &5);
    assert_eq!(result.len(), 0);
    assert_eq!(client.current_position_index(), 0);
}

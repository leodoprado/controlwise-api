package br.com.controlwise.api_controlwise.repositories;

import br.com.controlwise.api_controlwise.domain.user.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, String> {
    Optional<User> findByEmail(String email);
}
